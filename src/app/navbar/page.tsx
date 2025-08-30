import Navbar from '@/components/Navbar';

export default function NavbarPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <Navbar />
      
      {/* Demo Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Navigation Bar Demo
          </h1>
          <p className="text-xl text-gray-600">
            This page demonstrates the responsive navigation bar component
          </p>
        </div>

        {/* Content Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Ideas Forum</h2>
            <p className="text-gray-600">
              Share and discuss investment ideas with the community. Get feedback from experienced investors.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Topic of the Week</h2>
            <p className="text-gray-600">
              Focused discussions on trending investment topics and market analysis.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Resources</h2>
            <p className="text-gray-600">
              Educational content, tools, and guides to help you become a better investor.
            </p>
          </div>
        </div>

        {/* Mobile Testing Instructions */}
        <div className="mt-12 bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Mobile Testing Instructions
          </h3>
          <ul className="text-blue-800 space-y-2">
            <li>• Resize your browser window to less than 768px width</li>
            <li>• Click the hamburger menu button to open mobile navigation</li>
            <li>• Test the mobile menu dropdown functionality</li>
            <li>• Verify that desktop elements are hidden on mobile</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
