'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Save, Send, Building2, TrendingUp, DollarSign, FileText } from 'lucide-react';
import { useAuth } from '@/context/authProvider';

export default function SubmitIdeaPage() {
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    
    // Company Information
    companyName: '',
    stockSymbol: '',
    positionType: '',
    investmentHorizon: '',
    
    // Financial Data
    currentStockPrice: '',
    week52High: '',
    week52Low: '',
    annualRevenue: '',
    eps: '',
    peRatio: '',
    
    // Investment Thesis
    investmentDescription: ''
  });

  const [wordCount, setWordCount] = useState(0);
  const maxWords = 500;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Update word count for investment description
    if (field === 'investmentDescription') {
      const words = value.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
    }
  };

  const handleSaveDraft = () => {
    // Save draft functionality
    console.log('Saving draft:', formData);
    alert('Draft saved successfully!');
  };

  const handleSubmitIdea = async () => {
    if (wordCount > maxWords) {
      alert(`Please reduce the description to ${maxWords} words or fewer.`);
      return;
    }

    const userId = currentUser?.user?.id;
    if (!userId) {
      const message = 'Please sign in to submit an idea.';
      setErrorMessage(message);
      alert(message);
      return;
    }

    // Basic client-side validation for required fields since we are not using a native form submit
    const requiredFields = [
      'name',
      'email',
      'companyName',
      'stockSymbol',
      'positionType',
      'investmentHorizon',
      'currentStockPrice',
      'week52High',
      'week52Low',
      'annualRevenue',
      'eps',
      'peRatio',
      'investmentDescription'
    ];
    const missingFields = requiredFields.filter((field) => {
      const value = (formData as any)[field];
      return typeof value !== 'string' || value.trim().length === 0;
    });
    if (missingFields.length > 0) {
      const message = `Please fill all required fields: ${missingFields.join(', ')}`;
      setErrorMessage(message);
      alert(message);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const ideaPayload: any = {
        user_id: userId,
        data: {
          title: `${formData.companyName} (${formData.stockSymbol})`.trim(),
          description: formData.investmentDescription,
        },
        stock_details: {
          ticker: formData.stockSymbol,
          current_price: parseFloat(formData.currentStockPrice),
        },
        status: 'pending',
      };

      // Optionally include fields if present and valid numbers/strings
      if (formData.week52High && !Number.isNaN(parseFloat(formData.week52High))) {
        ideaPayload.stock_details.target_price = parseFloat(formData.week52High);
      }

      const response = await fetch('/api/submit-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idea: ideaPayload }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const baseMessage = (data && (data.error || data.message)) || 'Failed to submit idea.';
        const details = (data && data.details && Array.isArray(data.details.errors)) ? `\n- ${data.details.errors.join('\n- ')}` : '';
        const message = `${baseMessage}${details}`;
        setErrorMessage(message);
        alert(message);
        return;
      }

      setSuccessMessage('Investment idea submitted successfully!');
      alert('Investment idea submitted successfully!');
      setFormData({
        name: '',
        email: '',
        companyName: '',
        stockSymbol: '',
        positionType: '',
        investmentHorizon: '',
        currentStockPrice: '',
        week52High: '',
        week52Low: '',
        annualRevenue: '',
        eps: '',
        peRatio: '',
        investmentDescription: ''
      });
      setWordCount(0);
    } catch (error: any) {
      const message = error?.message ?? 'Unexpected error while submitting idea.';
      setErrorMessage(message);
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const positionTypes = [
    'Long Position',
    'Short Position',
    'Hold/Neutral',
    'Buy on Dips',
    'Sell on Rallies'
  ];

  const investmentHorizons = [
    '6 Months',
    '1-2 Years',
    '3-5 Years'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Submit Your Investment Idea
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Share your investment thesis and analysis with our community of experienced investors and financial experts.
          </p>
        </div>

        <form className="space-y-8">
          {/* Personal Information Section */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Enter your email address"
                  required
                />
              </div>
            </div>
          </div>

          {/* Company Information Section */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., Reliance Industries Limited"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="stockSymbol" className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Symbol *
                </label>
                <input
                  type="text"
                  id="stockSymbol"
                  value={formData.stockSymbol}
                  onChange={(e) => handleInputChange('stockSymbol', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., RELIANCE"
                  required
                />
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="positionType" className="block text-sm font-medium text-gray-700 mb-2">
                  Position Type *
                </label>
                <select
                  id="positionType"
                  value={formData.positionType}
                  onChange={(e) => handleInputChange('positionType', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="">Select position type</option>
                  {positionTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="investmentHorizon" className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Horizon *
                </label>
                <select
                  id="investmentHorizon"
                  value={formData.investmentHorizon}
                  onChange={(e) => handleInputChange('investmentHorizon', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                >
                  <option value="">Select investment horizon</option>
                  {investmentHorizons.map((horizon) => (
                    <option key={horizon} value={horizon}>
                      {horizon}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Financial Data Section */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Financial Data</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label htmlFor="currentStockPrice" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Stock Price (₹) *
                </label>
                <input
                  type="number"
                  id="currentStockPrice"
                  value={formData.currentStockPrice}
                  onChange={(e) => handleInputChange('currentStockPrice', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., 2450.50"
                  step="0.01"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="week52High" className="block text-sm font-medium text-gray-700 mb-2">
                  52 Week High (₹) *
                </label>
                <input
                  type="number"
                  id="week52High"
                  value={formData.week52High}
                  onChange={(e) => handleInputChange('week52High', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., 2800.00"
                  step="0.01"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="week52Low" className="block text-sm font-medium text-gray-700 mb-2">
                  52 Week Low (₹) *
                </label>
                <input
                  type="number"
                  id="week52Low"
                  value={formData.week52Low}
                  onChange={(e) => handleInputChange('week52Low', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., 2100.00"
                  step="0.01"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="annualRevenue" className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Revenue (₹ Cr) *
                </label>
                <input
                  type="number"
                  id="annualRevenue"
                  value={formData.annualRevenue}
                  onChange={(e) => handleInputChange('annualRevenue', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., 50000"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="eps" className="block text-sm font-medium text-gray-700 mb-2">
                  EPS (₹) *
                </label>
                <input
                  type="number"
                  id="eps"
                  value={formData.eps}
                  onChange={(e) => handleInputChange('eps', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., 85.50"
                  step="0.01"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="peRatio" className="block text-sm font-medium text-gray-700 mb-2">
                  P/E Ratio *
                </label>
                <input
                  type="number"
                  id="peRatio"
                  value={formData.peRatio}
                  onChange={(e) => handleInputChange('peRatio', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g., 28.65"
                  step="0.01"
                  required
                />
              </div>
            </div>
          </div>

          {/* Investment Thesis Section */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Investment Thesis</h2>
            </div>
            
            <div>
              <label htmlFor="investmentDescription" className="block text-sm font-medium text-gray-700 mb-2">
                Investment Idea Description *
              </label>
              <textarea
                id="investmentDescription"
                value={formData.investmentDescription}
                onChange={(e) => handleInputChange('investmentDescription', e.target.value)}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                placeholder="Share your detailed investment thesis, including your analysis of the company's fundamentals, market position, growth prospects, risks, and why you believe this is a good investment opportunity. Be specific and provide supporting data where possible."
                required
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">
                  Provide a comprehensive analysis of your investment idea
                </p>
                <p className={`text-sm ${wordCount > maxWords ? 'text-red-500' : 'text-gray-500'}`}>
                  {wordCount} / {maxWords} words
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200"
            >
              <Save className="w-4 h-4" />
              Save as Draft
            </button>
            
            <button
              type="button"
              onClick={handleSubmitIdea}
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Idea'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
