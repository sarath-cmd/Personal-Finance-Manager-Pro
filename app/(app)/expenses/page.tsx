import FilteredTransactionsPage from "@/components/transactions/FilteredTransactionsPage";

export default function ExpensesPage() {
  return (
    <FilteredTransactionsPage
      type="expense"
      title="Expense Tracker"
      subtitle="Recorded expenses by category and merchant."
    />
  );
}
