import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#E70013] flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                FreeTun
              </span>
            </div>
            <div className="flex gap-4">
              <a
                href="#features"
                className="text-gray-700 hover:text-[#E70013] transition-colors dark:text-gray-300"
              >
                Features
              </a>
              <a
                href="#about"
                className="text-gray-700 hover:text-[#E70013] transition-colors dark:text-gray-300"
              >
                About
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="py-20 text-center sm:py-32">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-100 rounded-full">
            <span className="text-2xl">🇹🇳</span>
            <span className="text-sm font-medium text-[#E70013]">Made in Tunisia</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
            Freelance Marketplace
            <br />
            <span className="text-[#E70013]">Built for Tunisia</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-300">
            Connect with local talents and opportunities. Fair pricing, secure
            payments with Flouci & D17, and built for the Tunisian market.
          </p>
          <div className="mt-10 flex items-center justify-center gap-6">
            <a
              href="#"
              className="rounded-lg bg-[#E70013] px-8 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#C00011] transition-all hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E70013]"
            >
              Get Started
            </a>
            <a
              href="#features"
              className="rounded-lg border-2 border-gray-300 px-8 py-3 text-sm font-semibold text-gray-900 hover:border-[#E70013] hover:text-[#E70013] transition-all dark:border-gray-600 dark:text-white dark:hover:border-[#E70013]"
            >
              Learn More
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-20">
          <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
            Why Choose FreeTun?
          </h2>
          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group rounded-xl border border-gray-200 bg-white p-8 transition-all hover:shadow-xl hover:border-[#E70013] dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 group-hover:bg-[#E70013] transition-colors">
                <span className="text-2xl group-hover:scale-110 transition-transform">💳</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Tunisian Payments
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Support for D17, Flouci, and local payment methods. No
                international barriers.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-xl border border-gray-200 bg-white p-8 transition-all hover:shadow-xl hover:border-[#E70013] dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 group-hover:bg-[#E70013] transition-colors">
                <span className="text-2xl group-hover:scale-110 transition-transform">🔒</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Secure Escrow
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Your money is protected until work is completed. Fair for both
                parties.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-xl border border-gray-200 bg-white p-8 transition-all hover:shadow-xl hover:border-[#E70013] dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 group-hover:bg-[#E70013] transition-colors">
                <span className="text-2xl group-hover:scale-110 transition-transform">🌍</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                French & Arabic
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Fully localized interface. Work in the language you prefer.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-xl border border-gray-200 bg-white p-8 transition-all hover:shadow-xl hover:border-[#E70013] dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 group-hover:bg-[#E70013] transition-colors">
                <span className="text-2xl group-hover:scale-110 transition-transform">⭐</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Fair Commission
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Only 5% for freelancers, 2% for clients. No hidden fees.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group rounded-xl border border-gray-200 bg-white p-8 transition-all hover:shadow-xl hover:border-[#E70013] dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 group-hover:bg-[#E70013] transition-colors">
                <span className="text-2xl group-hover:scale-110 transition-transform">💬</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Real-time Chat
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Communicate directly with clients and freelancers instantly.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group rounded-xl border border-gray-200 bg-white p-8 transition-all hover:shadow-xl hover:border-[#E70013] dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-red-50 group-hover:bg-[#E70013] transition-colors">
                <span className="text-2xl group-hover:scale-110 transition-transform">🎯</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Local First
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Built specifically for the Tunisian market and ecosystem.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-20">
          <div className="rounded-2xl bg-gradient-to-r from-[#E70013] to-[#C00011] px-8 py-16 text-center shadow-2xl">
            <h2 className="text-3xl font-bold text-white">
              Ready to Get Started?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-red-50">
              Join hundreds of Tunisian freelancers and businesses. Start your
              journey today.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <a
                href="#"
                className="rounded-lg bg-white px-8 py-3 text-sm font-semibold text-[#E70013] hover:bg-gray-50 transition-all shadow-lg hover:shadow-xl"
              >
                Sign Up as Freelancer
              </a>
              <a
                href="#"
                className="rounded-lg border-2 border-white px-8 py-3 text-sm font-semibold text-white hover:bg-white/10 transition-all"
              >
                Post a Project
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">
              © 2025 FreeTun. Built with ❤️ for Tunisia 🇹🇳
            </p>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">
              Coming Soon - Currently in Development
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
