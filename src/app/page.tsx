import PaymentForm from "@/components/PaymentForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-900">
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="bg-white rounded-xl shadow-xl p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Card Validation
          </h1>
          <p className="text-gray-600 mb-6">
            Enter your card details below to validate using Stripe&apos;s secure
            payment form.
          </p>

          <PaymentForm />

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              This is a test environment. Use Stripe test card numbers:{" "}
              <br />
              <code className="bg-gray-100 px-1 rounded">4242 4242 4242 4242</code>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
