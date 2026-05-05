import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ClipboardPaste, FileDown, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSettings, useCreateCashflow } from "@/hooks/use-finance";
import { formatCurrency, getCurrencySymbol } from "@/lib/currency";

type Bucket = "needs" | "wants";

interface ParsedRow {
  id: string;
  name: string;
  amount: number;
  hasAmount: boolean;
  isTotal: boolean;
}

interface PreviewRow {
  id: string;
  name: string;
  amount: string; // editable string
  bucket: Bucket;
  include: boolean;
  hasAmount: boolean;
  isTotal: boolean;
}

// Names that START WITH a totals keyword are flagged as a likely totals row
// (case-insensitive). They're excluded from the import by default but the
// user can re-tick the include checkbox if it was a false positive.
const TOTAL_RE = /^\s*(monthly\s+total|grand\s+total|sub\s*total|monthly|totals?|sum)\b/i;

// Case-insensitive substring keywords used to pre-suggest the bucket for a
// pasted row. Wants are checked first so that something like "Amazon Prime"
// wins over a generic "amazon" need keyword.
const WANT_KEYWORDS = [
  // Streaming & entertainment subscriptions
  "netflix", "spotify", "disney", "hulu", "hbo", "max ",
  "apple tv", "apple music", "youtube premium", "youtube music",
  "paramount", "peacock", "audible", "kindle unlimited",
  "amazon prime", "prime video", "prime music",
  "playstation", "xbox", "nintendo", "steam ", "twitch", "patreon",
  // Fitness / lifestyle memberships
  "gym", "fitness", "peloton", "yoga", "pilates", "crossfit", "classpass",
  // Gambling
  "lottery", "lotto", "betting", "casino",
  // Eating out / takeaway
  "uber eats", "doordash", "grubhub", "deliveroo", "just eat", "takeaway",
  "starbucks", "costa", "pret", "restaurant", "dining", "cafe",
  // Going out
  "cinema", "movies", "concert", "ticketmaster",
];

const NEED_KEYWORDS = [
  // Housing
  "rent", "mortgage", "council tax", "property tax", "service charge",
  "ground rent", "hoa",
  // Utilities
  "water", "gas", "electric", "electricity", "heating", "utility", "utilities",
  "internet", "broadband", "wifi", "phone bill", "mobile bill",
  // Insurance
  "insurance",
  // Groceries & essentials
  "groceries", "supermarket", "tesco", "sainsbury", "aldi", "lidl",
  "asda", "morrisons", "waitrose", "whole foods", "trader joe",
  // Family / health
  "childcare", "nursery", "school fees", "tuition",
  "doctor", "dentist", "pharmacy", "prescription", "medical",
  // Transport essentials
  "fuel", "petrol", "gasoline", "diesel", "bus pass", "train pass",
  "season ticket", "metro pass",
  // Debt servicing
  "loan", "student loan", "credit card payment",
];

export function suggestBucket(name: string): Bucket {
  const n = name.toLowerCase();
  for (const k of WANT_KEYWORDS) {
    if (n.includes(k)) return "wants";
  }
  for (const k of NEED_KEYWORDS) {
    if (n.includes(k)) return "needs";
  }
  return "needs";
}

// Split a line into [name, amountText]. Tab takes priority. Otherwise we walk
// backwards and pull the trailing token that looks like a number/currency
// blob, treating everything before it as the name.
function splitLine(raw: string): { name: string; amountText: string } {
  const line = raw.trim();
  if (!line) return { name: "", amountText: "" };

  if (line.includes("\t")) {
    const parts = line.split("\t").map(p => p.trim()).filter(p => p.length > 0);
    if (parts.length === 0) return { name: "", amountText: "" };
    if (parts.length === 1) return { name: parts[0], amountText: "" };
    const amountText = parts[parts.length - 1];
    const name = parts.slice(0, -1).join(" ").trim();
    return { name, amountText };
  }

  // Whitespace-separated: take the last whitespace-delimited token if it
  // looks numeric (optionally prefixed with a currency symbol).
  const match = line.match(/^(.*?)\s+([£$€]?\s*-?[\d.,]+)\s*$/);
  if (match) {
    return { name: match[1].trim(), amountText: match[2].trim() };
  }
  return { name: line, amountText: "" };
}

function parseAmount(text: string): number {
  if (!text) return NaN;
  // Strip currency symbols, whitespace, and thousand-separator commas.
  const cleaned = text.replace(/[£$€\s]/g, "").replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

export function parsePaste(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/);
  const rows: ParsedRow[] = [];
  let counter = 0;
  for (const raw of lines) {
    if (!raw.trim()) continue;
    const { name, amountText } = splitLine(raw);
    if (!name && !amountText) continue;
    const amount = parseAmount(amountText);
    const hasAmount = !Number.isNaN(amount) && amount > 0;
    const isTotal = TOTAL_RE.test(name);
    rows.push({
      id: `r${counter++}`,
      name: name || "(unnamed)",
      amount: hasAmount ? amount : 0,
      hasAmount,
      isTotal,
    });
  }
  return rows;
}

export function BulkImportExpenses({ onImported }: { onImported?: () => void }) {
  const { data: settings } = useSettings();
  const currency = settings?.currency || "USD";
  const { toast } = useToast();
  const createCashflow = useCreateCashflow();

  const [text, setText] = useState("");
  const [rows, setRows] = useState<PreviewRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const reparse = (newText: string) => {
    setText(newText);
    const parsed = parsePaste(newText);
    setRows(parsed.map(p => ({
      id: p.id,
      name: p.name,
      amount: p.hasAmount ? String(p.amount) : "",
      // Pre-suggest the bucket from the name; user can override per row.
      bucket: suggestBucket(p.name),
      // Don't auto-include totals or rows missing an amount.
      include: p.hasAmount && !p.isTotal,
      hasAmount: p.hasAmount,
      isTotal: p.isTotal,
    })));
  };

  const updateRow = (id: string, patch: Partial<PreviewRow>) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));
  };

  const removeRow = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const clearAll = () => {
    setText("");
    setRows([]);
  };

  const selected = useMemo(() => rows.filter(r => {
    const amt = Number(r.amount);
    return r.include && r.name.trim() && Number.isFinite(amt) && amt > 0;
  }), [rows]);

  const selectedTotal = useMemo(
    () => selected.reduce((s, r) => s + Number(r.amount), 0),
    [selected]
  );

  const handleImport = async () => {
    if (selected.length === 0) return;
    setSubmitting(true);
    try {
      for (const r of selected) {
        await createCashflow.mutateAsync({
          name: r.name.trim(),
          amount: Number(r.amount).toString(),
          type: "expense",
          bucket: r.bucket,
        });
      }
      toast({
        title: `Imported ${selected.length} ${selected.length === 1 ? "expense" : "expenses"}`,
        description: `Added ${formatCurrency(selectedTotal, currency)} of monthly expenses.`,
      });
      clearAll();
      onImported?.();
    } catch (err: unknown) {
      const description = err instanceof Error ? err.message : "Something went wrong while saving.";
      toast({
        title: "Import failed",
        description,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-3xl border border-border bg-card/60 backdrop-blur-xl p-6 shadow-sm" data-testid="section-bulk-import">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-serif text-xl font-light tracking-tight">Bulk Import Expenses</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Paste a name + amount per line straight from your spreadsheet. Currency symbols and commas are stripped automatically; rows that look like totals are excluded by default.
          </p>
        </div>
        <ClipboardPaste size={20} className="text-muted-foreground flex-shrink-0 mt-1" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bulk-import-textarea" className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
          Paste rows
        </Label>
        <Textarea
          id="bulk-import-textarea"
          value={text}
          onChange={(e) => reparse(e.target.value)}
          placeholder={`Rent\t£1,042.01\nGroceries\t£400.00\nNetflix\t£10.99`}
          className="min-h-[140px] font-mono text-xs bg-background tabular-nums"
          data-testid="textarea-bulk-import"
        />
      </div>

      {rows.length > 0 && (
        <>
          <div className="mt-5 rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
            <div className="hidden sm:grid sm:grid-cols-[28px_minmax(0,1fr)_120px_140px_28px] gap-3 px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-muted-foreground border-b border-border/60 bg-muted/30">
              <span></span>
              <span>Name</span>
              <span>Amount</span>
              <span>Bucket</span>
              <span></span>
            </div>
            <ul className="divide-y divide-border/40">
              {rows.map(r => {
                const noAmount = !r.hasAmount && !Number(r.amount);
                const dimmed = noAmount;
                return (
                  <li
                    key={r.id}
                    className={
                      "grid grid-cols-[28px_minmax(0,1fr)_120px_140px_28px] gap-3 px-3 py-2 items-center " +
                      (dimmed ? "opacity-60" : "")
                    }
                    data-testid={`row-import-${r.id}`}
                  >
                    <Checkbox
                      checked={r.include}
                      disabled={noAmount}
                      onCheckedChange={(v) => updateRow(r.id, { include: v === true })}
                      aria-label={`Include ${r.name}`}
                      data-testid={`checkbox-import-${r.id}`}
                    />
                    <div className="min-w-0">
                      <Input
                        value={r.name}
                        onChange={(e) => updateRow(r.id, { name: e.target.value })}
                        className="h-8 text-sm bg-background"
                        data-testid={`input-import-name-${r.id}`}
                      />
                      {(r.isTotal || noAmount) && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {noAmount ? "Skipped — no amount detected" : "Likely a totals row"}
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">{getCurrencySymbol(currency)}</span>
                      <Input
                        type="number"
                        value={r.amount}
                        onChange={(e) => {
                          const v = e.target.value;
                          const n = Number(v);
                          updateRow(r.id, {
                            amount: v,
                            hasAmount: Number.isFinite(n) && n > 0,
                          });
                        }}
                        className="h-8 text-sm pl-5 bg-background tabular-nums"
                        placeholder="0.00"
                        data-testid={`input-import-amount-${r.id}`}
                      />
                    </div>
                    <div
                      className="inline-flex items-center gap-0.5 rounded-full border border-border/60 bg-background/80 p-0.5 w-fit"
                      role="radiogroup"
                      aria-label={`Bucket for ${r.name}`}
                    >
                      {(["needs", "wants"] as const).map(b => {
                        const active = r.bucket === b;
                        return (
                          <button
                            key={b}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => updateRow(r.id, { bucket: b })}
                            className={
                              "rounded-full px-2.5 py-0.5 text-[11px] capitalize transition-colors " +
                              (active
                                ? "bg-foreground text-background"
                                : "text-muted-foreground hover:text-foreground")
                            }
                            data-testid={`button-import-bucket-${b}-${r.id}`}
                          >
                            {b === "needs" ? "Need" : "Want"}
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-[hsl(var(--chart-negative))]"
                      onClick={() => removeRow(r.id)}
                      aria-label={`Remove ${r.name} from import`}
                      data-testid={`button-import-remove-${r.id}`}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
            <span className="text-xs text-muted-foreground tabular-nums" data-testid="text-import-summary">
              <span className="text-foreground font-medium">{selected.length}</span> {selected.length === 1 ? "row" : "rows"} selected · {formatCurrency(selectedTotal, currency)}/month
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={submitting}
                data-testid="button-import-clear"
              >
                Clear
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={selected.length === 0 || submitting}
                className="gap-2"
                data-testid="button-import-confirm"
              >
                <FileDown size={14} />
                {submitting ? "Importing…" : `Import ${selected.length || ""}`.trim()}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
