function PaymentCancelled() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-red-50">
      <h1 className="text-3xl font-bold mb-4 text-red-700">Payment Cancelled</h1>
      <p className="text-lg">You cancelled your payment. No charges were made.</p>
      <a href="/profile" className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
        Go Back to Profile
      </a>
    </div>
  );
}

export default PaymentCancelled;
