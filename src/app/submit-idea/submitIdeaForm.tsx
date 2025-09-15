'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Send, Building2, TrendingUp, DollarSign } from 'lucide-react';
import { useAuth } from '@/context/authProvider';
import { createClient } from '@/lib/supabase/client';

// import { MockUploadAdapterPlugin } from '@/utils/mockUploadAdapter';
import { SupabaseUploadAdapter } from '@/utils/supabaseUploadAdapter';
import dynamic from 'next/dynamic';
export default function SubmitIdeaForm() {
   const editorRef = useRef<any>(null);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [CKEditorComp, setCKEditorComp] = useState<any>(null);
  const [ClassicEditorComp, setClassicEditorComp] = useState<any>(null);

  // load CKEditor dynamically on client
  useEffect(() => {
    (async () => {
      const CKEditor = dynamic(
  () => import("@ckeditor/ckeditor5-react").then(mod => mod.CKEditor),
  { ssr: false }
);
      const ClassicEditor = (await import('@ckeditor/ckeditor5-build-classic')).default;
      setCKEditorComp(() => CKEditor);
      setClassicEditorComp(() => ClassicEditor);
      setEditorLoaded(true);
    })();
  }, []);

  async function deleteImageFromUrl(publicUrl: string) {
  const supabase = createClient()
  const bucketName = 'user-uploads'

  const url = new URL(publicUrl)
  const pathIndex = url.pathname.indexOf(`${bucketName}/`)
  if (pathIndex === -1) throw new Error("Invalid URL")

  // Remove the bucket name from the path
  const filePath = url.pathname.substring(pathIndex + bucketName.length + 1) 

  const { error } = await supabase.storage.from(bucketName).remove([filePath])
  console.log(error,'error');
  if (error) throw error

  console.log("Deleted file:", filePath)
}



 useEffect(() => {
    if (editorRef.current) {
      editorRef.current.model.document.on("change:data", () => {
        const removedItems = Array.from(
          editorRef.current.model.document.differ.getChanges()
        ).filter((change) => change.type === "remove")
        // console.log(removedItems)
        removedItems.forEach((removedItem: any) => {
          const src = removedItem.attributes.get("src")
          if (src) {
            deleteImageFromUrl(src)
            // Perform any action required with the URL
          }
        })
      })
    }
  }, [editorRef.current])
  
  // Authentication and routing hooks
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  
  // CKEditor ref for accessing editor instance

  // Form state hooks - all useState declarations at the top level
  const [formData, setFormData] = useState({
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

  // ===== HELPER FUNCTIONS =====
  
  // Helper function to count words from HTML content
  const countWordsFromHTML = (html: string): number => {
    if (!html || html.trim() === '') return 0;
    
    try {
      // Create a temporary DOM element to parse HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Get text content without HTML tags
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      // Clean up the text and count words
      const cleanText = textContent.replace(/\s+/g, ' ').trim();
      if (cleanText === '') return 0;
      
      // Count words (split by whitespace and filter empty strings)
      const words = cleanText.split(/\s+/).filter(word => word.length > 0);
      return words.length;
    } catch (error) {
      console.error('Error counting words from HTML:', error);
      return 0;
    }
  };

  // ===== AUTHENTICATION GATING LOGIC =====
  
  // Authentication gating - redirect unauthenticated users
  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace('/sign-in');
    }
  }, [currentUser, isLoading, router]);

  // Initialize word count on component mount
  useEffect(() => {
    if (formData.investmentDescription) {
      const words = countWordsFromHTML(formData.investmentDescription);
      setWordCount(words);
    }
  }, []);

  // Update word count whenever investment description changes
  useEffect(() => {
    const words = countWordsFromHTML(formData.investmentDescription);
    setWordCount(words);
  }, [formData.investmentDescription]);

  // ===== CONDITIONAL RENDERING (After all hooks are declared) =====
  
  // Prevent rendering form if user is loading
  if (isLoading) {
    return <p>Loading...</p>;
  }

  // Prevent rendering form if user is not authenticated
  if (!currentUser) {
    return null;
  }

  // ===== EVENT HANDLERS AND HELPER FUNCTIONS =====
  
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Update word count for investment description
    if (field === 'investmentDescription') {
      const words = countWordsFromHTML(value);
      setWordCount(words);
    }
  };

  // Handle CKEditor content change
  const handleEditorChange = (event: any, editor: any) => {
    const data = editor.getData();
    console.log(event,'event');

     const viewDoc = editor.editing.view.document;

    const handler = () => {
      const selection = editor.model.document.selection;
      const selectedElement = selection.getSelectedElement();

      if (selectedElement?.is("element", "imageBlock")) {
        const url = selectedElement.getAttribute("src");
        if (url) {
          console.log("Image URL:", url);
        }
      }
    };
    
    setFormData(prev => ({
      ...prev,
      investmentDescription: data
    }));
    
    // Update word count for rich text content
    const words = countWordsFromHTML(data);
    setWordCount(words);
  };

  const handleSaveDraft = () => {
    // Save draft functionality
    console.log('Saving draft:', formData);
    alert('Draft saved successfully!');
  };

  function SupabaseUploadAdapterPlugin(userId: string) {
  return function (editor: any) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
      return new SupabaseUploadAdapter(loader, userId)
    }
  }
}


  const handleSubmitIdea = async () => {
    if (wordCount > maxWords) {
      alert(`Please reduce the description to ${maxWords} words or fewer.`);
      return;
    }

    // Get authenticated user ID - this should always exist due to auth gating
    const userId = currentUser?.user?.id;
    if (!userId) {
      const message = 'Authentication error. Please sign in again.';
      setErrorMessage(message);
      alert(message);
      return;
    }

    // Basic client-side validation for required fields (excluding personal info)
    const requiredFields = [
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
      // Helper function to safely parse numeric values
      const parseNumericValue = (value: string): number | undefined => {
        const parsed = parseFloat(value);
        return !Number.isNaN(parsed) ? parsed : undefined;
      };

      // Helper function to safely get string values
      const getStringValue = (value: string): string | undefined => {
        return value && value.trim().length > 0 ? value.trim() : undefined;
      };

      // Build comprehensive payload with all form fields
      const ideaPayload: any = {
        user_id: userId,
        // Data object: Contains all metadata and descriptive information
        data: {
          // Required core fields
          title: `${formData.companyName} (${formData.stockSymbol})`.trim(),
          description: formData.investmentDescription,
          
          // Company and investment metadata (snake_case for database schema)
          company_name: getStringValue(formData.companyName),
          position_type: getStringValue(formData.positionType),
          investment_horizon: getStringValue(formData.investmentHorizon),
          
          // Additional metadata that could be useful
          word_count: wordCount,
          submission_timestamp: new Date().toISOString(),

           // Required stock identifier
          ticker: formData.stockSymbol,
          
          // Price information (parsed as numbers with fallback to undefined)
          current_price: parseNumericValue(formData.currentStockPrice),
          target_price: parseNumericValue(formData.week52High), // Using week52High as target price
          
          // 52-week price range
          week52_high: parseNumericValue(formData.week52High),
          week52_low: parseNumericValue(formData.week52Low),
        },
        // Stock details object: Contains all financial metrics and stock-specific data
        stock_details: {
          // Financial metrics
          annual_revenue: parseNumericValue(formData.annualRevenue),
          eps: parseNumericValue(formData.eps),
          pe_ratio: parseNumericValue(formData.peRatio),
          
          // Additional stock metadata
          currency: 'INR', // Assuming Indian market
          market: 'NSE/BSE', // Indian stock exchanges
        },
        status: 'pending',
      };

      const response = await fetch('https://acsobefarzmetevcseal.supabase.co/functions/v1/rest-idea-submitted', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.access_token}`,
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
      // Reset form data (excluding personal info which is now handled by auth)
      setFormData({
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
      
      // Reset CKEditor content
      if (editorRef.current) {
        editorRef.current.setData('');
      }
    } catch (error: any) {
      const message = error?.message ?? 'Unexpected error while submitting idea.';
      setErrorMessage(message);
      alert(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===== FORM OPTIONS AND CONSTANTS =====
  
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

  // ===== COMPONENT RENDER =====
  
  return (
    <div className="min-h-screen bg-gray-50">
      <style jsx global>{`
        .ck-editor__editable {
          min-height: 350px !important;
          max-height: 500px !important;
          overflow-y: auto !important;
        }
        .ck-editor__main {
          min-height: 350px !important;
        }
        .ck-content {
          min-height: 350px !important;
          padding: 1rem !important;
        }
        .ck-editor__editable_inline {
          min-height: 350px !important;
        }
        @media (max-height: 800px) {
          .ck-editor__editable {
            min-height: 300px !important;
            max-height: 400px !important;
          }
          .ck-editor__main {
            min-height: 300px !important;
          }
          .ck-content {
            min-height: 300px !important;
          }
        }
      `}</style>
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Submit Your Investment Idea
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl">
            Share your investment thesis and analysis with our community of experienced investors and financial experts.
          </p>
        </div>

        <form className="space-y-6">
          {/* Company Information Section */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-5">
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
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-5">
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
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Investment Thesis</h2>
            </div>
            
            <div>
              <label htmlFor="investmentDescription" className="block text-sm font-medium text-gray-700 mb-2">
                Investment Idea Description *
              </label>
              <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-colors">
                <div className="ck-editor-container" style={{ minHeight: '400px' }}>
                  {editorLoaded && CKEditorComp && ClassicEditorComp ? (
            <CKEditorComp
              editor={ClassicEditorComp}
              data={formData.investmentDescription}
              onReady={editor => {
                editorRef.current = editor;
                console.log('CKEditor is ready', editor);
              }}
              onChange={handleEditorChange}
              config={{
                placeholder:
                  'Share your detailed investment thesis, including your analysis...',
                toolbar: [
                  'heading', '|',
                  'bold', 'italic', 'underline', '|',
                  'bulletedList', 'numberedList', '|',
                  'outdent', 'indent', '|',
                  'blockQuote', 'insertTable', '|',
                  'link', 'imageUpload', '|',
                  'undo', 'redo'
                ],
                image: {
                  toolbar: [
                    'imageTextAlternative', '|',
                    'imageStyle:alignLeft',
                    'imageStyle:alignCenter',
                    'imageStyle:alignRight'
                  ]
                },
                table: {
                  contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells']
                },
                extraPlugins: [SupabaseUploadAdapterPlugin(currentUser.user.id)]
              }}
            />
          ) : (
            <div className="p-4 text-gray-500">Editor loading...</div>
          )}
                </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">
                  Provide a comprehensive analysis of your investment idea. Use formatting tools to structure your content.
                </p>
                <p className={`text-sm ${wordCount > maxWords ? 'text-red-500' : 'text-gray-500'}`}>
                  {wordCount} / {maxWords} words
                </p>
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
