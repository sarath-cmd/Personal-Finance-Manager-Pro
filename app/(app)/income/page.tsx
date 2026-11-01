import FilteredTransactionsPage from "@/components/transactions/FilteredTransactionsPage";

export default function IncomePage() {
  return (
    <FilteredTransactionsPage
      type="income"
      title="Income Tracker"
      subtitle="Recorded income by source and category."
    />
  );
}
