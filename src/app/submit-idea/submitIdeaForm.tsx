'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Send, Building2, TrendingUp, DollarSign } from 'lucide-react';
import { useAuth } from '@/context/authProvider';
import { createClient } from '@/lib/supabase/client';
import toast, { Toaster } from 'react-hot-toast';

// import { MockUploadAdapterPlugin } from '@/utils/mockUploadAdapter';
import { SupabaseUploadAdapter } from '@/utils/supabaseUploadAdapter';
import dynamic from 'next/dynamic';

type ChangeRecord = {
  type: string;
  attributes?: Map<string, any>;
  name?: string;
  length?: number;
  position?: any;
};

export default function SubmitIdeaForm() {
  const editorRef = useRef<any>(null);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [CKEditorComp, setCKEditorComp] = useState<any>(null);
  const [ClassicEditorComp, setClassicEditorComp] = useState<any>(null);
  const isResetting = useRef(false);
  const user= useAuth();

  // load CKEditor dynamically on client
  useEffect(() => {
    let isMounted = true;
    
    (async () => {
      try {
        const CKEditor = dynamic(
          () => import("@ckeditor/ckeditor5-react").then(mod => mod.CKEditor),
          { ssr: false }
        );
        const ClassicEditor = (await import('@ckeditor/ckeditor5-build-classic')).default;
        
        if (isMounted) {
          setCKEditorComp(() => CKEditor);
          setClassicEditorComp(() => ClassicEditor);
          setEditorLoaded(true);
        }
      } catch (error) {
        console.error('Error loading CKEditor:', error);
        if (isMounted) {
          setEditorLoaded(true); // Still set to true to show error state
        }
      }
    })();
    
    return () => {
      isMounted = false;
    };
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

}



useEffect(() => {
  if (editorRef.current) {
    editorRef.current.model.document.on("change:data", () => {
      if (isResetting.current) return; // skip auto-delete on reset

      const removedItems: ChangeRecord[] = Array.from(
        editorRef.current.model.document.differ.getChanges() as Iterable<ChangeRecord>
      ).filter((change: ChangeRecord) => change.type === "remove");

      removedItems.forEach((removedItem) => {
        const src = removedItem.attributes?.get("src");
        if (src) {
          deleteImageFromUrl(src);
        }
      });
    });
  }
}, [editorRef.current]);
  
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
    marketCap: '',
    
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

    useEffect(() => {
    const fetchDraft = async () => {
      try {
        if(!user?.currentUser?.access_token) return
        const res = await fetch('https://acsobefarzmetevcseal.supabase.co/functions/v1/rest-idea-submitted/draft', {
          headers: {
            Authorization: `Bearer ${user?.currentUser?.access_token}`,
          }
        });
        const json = await res.json();

        // Check if draft exists
        const draftData = json?.draft?.data;
        const stockData = json?.draft?.stock_details;
        if (draftData) {
        setFormData(prev => ({
             ...prev,
            companyName: draftData.company_name || prev.companyName,
            stockSymbol: draftData.ticker || prev.stockSymbol,
    positionType: draftData.position_type || prev.positionType,
    investmentHorizon: draftData.investment_horizon || prev.investmentHorizon,
    marketCap: draftData.market_cap || prev.marketCap,
    currentStockPrice: draftData.current_price || prev.currentStockPrice,
    week52High: draftData.week52_high || prev.week52High,
    week52Low: draftData.week52_low || prev.week52Low,
    annualRevenue: stockData.annual_revenue || prev.annualRevenue,
    eps: stockData?.eps || prev.eps,
    peRatio: stockData?.pe_ratio || prev.peRatio,
    investmentDescription: draftData.description || prev.investmentDescription,
  }));
}
      } catch (error) {
        console.error('Error fetching draft:', error);
      }
    };

    fetchDraft();
  }, [currentUser]);
  

  const [wordCount, setWordCount] = useState(0);
  const maxWords = 600;
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
      router.replace('/');
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
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

     const viewDoc = editor.editing.view.document;

    const handler = () => {
      const selection = editor.model.document.selection;
      const selectedElement = selection.getSelectedElement();

      if (selectedElement?.is("element", "imageBlock")) {
        const url = selectedElement.getAttribute("src");
        if (url) {
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
    submitDraft();
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
      toast.error(`Please reduce the description to ${maxWords} words or fewer.`);
      return;
    }

    // Get authenticated user ID - this should always exist due to auth gating
    const userId = currentUser?.user?.id;
    if (!userId) {
      const message = 'Authentication error. Please sign in again.';
      setErrorMessage(message);
      toast.error(message);
      return;
    }

    // Basic client-side validation for required fields (excluding personal info)
    const requiredFields = [
      'companyName',
      'stockSymbol',
      'positionType',
      'investmentHorizon',
      'investmentDescription',
      'currentStockPrice',
    ];

    // Field name mapping for user-friendly error messages
    const fieldLabels: { [key: string]: string } = {
      'companyName': 'Company Name',
      'stockSymbol': 'Stock Symbol',
      'positionType': 'Position Type',
      'investmentHorizon': 'Investment Horizon',
      'marketCap': 'Market Cap',
      'currentStockPrice': 'Current Stock Price',
      'week52High': '52 Week High',
      'week52Low': '52 Week Low',
      'annualRevenue': 'Annual Revenue',
      'eps': 'Earnings Per Share (EPS)',
      'peRatio': 'PE Ratio',
      'investmentDescription': 'Investment Idea Description'
    };

    const missingFields = requiredFields.filter((field) => {
  const value = (formData as any)[field];
  return value === null || value === undefined || String(value).trim().length === 0;
});


    
    if (missingFields.length > 0) {
      const missingFieldLabels = missingFields.map(field => fieldLabels[field] || field);
      const message = `Please fill all required fields: ${missingFieldLabels.join(', ')}`;
      setErrorMessage(message);
      toast.error(message);
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
          market_cap: getStringValue(formData.marketCap),
          
          // Additional metadata that could be useful
          word_count: wordCount,
          submission_timestamp: new Date().toISOString(),

           // Required stock identifier
          ticker: formData.stockSymbol,
          current_price: parseNumericValue(formData.currentStockPrice),
          
          // Price information (parsed as numbers with fallback to undefined)
          
          // 52-week price range
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
        toast.error(message);
        return;
      }

      setSuccessMessage('Investment idea submitted successfully!');
      toast.success('Investment idea submitted successfully!');
      // Reset form data (excluding personal info which is now handled by auth)
      setFormData({
        companyName: '',
        stockSymbol: '',
        positionType: '',
        investmentHorizon: '',
        marketCap: '',
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
      const resetEditor = () => {
  if (editorRef.current) {
    isResetting.current = true;
    editorRef.current.setData('');
    // allow CKEditor to fire change:data first
    setTimeout(() => {
      isResetting.current = false;
    }, 0);
  }
};
    resetEditor();
    } catch (error: any) {
      const message = error?.message ?? 'Unexpected error while submitting idea.';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitDraft = async () => {
    const parseNumericValue = (value: string): number | undefined => {
        const parsed = parseFloat(value);
        return !Number.isNaN(parsed) ? parsed : undefined;
      };

      // Helper function to safely get string values
      const getStringValue = (value: string): string | undefined => {
        return value && value.trim().length > 0 ? value.trim() : undefined;
      };
    try {
      setIsSubmitting(true);
      const ideaPayload: any = {
        data: {
          // Required core fields
          title: `${formData.companyName} (${formData.stockSymbol})`.trim(),
          description: formData.investmentDescription,
          
          // Company and investment metadata (snake_case for database schema)
          company_name: getStringValue(formData.companyName),
          position_type: getStringValue(formData.positionType),
          investment_horizon: getStringValue(formData.investmentHorizon),
          market_cap: getStringValue(formData.marketCap),
          
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
        stock_details: {
          annual_revenue: parseNumericValue(formData.annualRevenue),
          eps: parseNumericValue(formData.eps),
          pe_ratio: parseNumericValue(formData.peRatio),
          
          currency: 'INR', // Assuming Indian market
          market: 'NSE/BSE', // Indian stock exchanges
        },
      };

      const response = await fetch('https://acsobefarzmetevcseal.supabase.co/functions/v1/rest-idea-submitted/draft', {
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
        toast.error(message);
        return;
      }
      toast.success('Draft idea submitted successfully!');  
  }
  catch (error: any) {
    const message = error?.message ?? 'Unexpected error while submitting idea.';
    setErrorMessage(message);
    toast.error(message);
  }
  finally {
    setIsSubmitting(false);
  }
}

  // ===== FORM OPTIONS AND CONSTANTS =====
  
  const positionTypes = [
    'Long',
    'Hold',
    'Buy on Dips'
  ];

  const investmentHorizons = [
    '6 Months',
    '1-2 Years',
    '3-5 Years'
  ];

  const marketCapOptions = [
    'Small',
    'Medium',
    'Large'
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
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pt-20">
        {/* Page Header */}
        <div className="mb-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Submit Your Investment Idea
          </h1>
          <p className="text-lg text-gray-600 max-w-4xl">
            Share your investment thesis and analysis with our community of experienced investors and financial experts.
          </p>
        </div>

        <form className="space-y-4">
          {/* Company Information Section */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Company Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div>
                <label htmlFor="stockSymbol" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Stock Price
                </label>
                <input
                  type="number"
                  id="currentStockPrice"
                  value={formData.currentStockPrice}
                  onChange={(e) => handleInputChange('currentStockPrice', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          {/* Financial Data Section */}
          

          {/* Investment Thesis Section */}
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
            <div className="flex items-center gap-3 mb-4">
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
              onReady={(editor: any) => {
                editorRef.current = editor;
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
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading editor...</p>
            </div>
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
          <div className="flex flex-col sm:flex-row justify-end gap-4 pt-4 border-t border-gray-200">
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
      <Toaster
      position="top-center"
      toastOptions={{
        duration: 3000,
        className:
          "bg-transparent border border-blue-200 backdrop-blur-md text-white font-medium shadow-lg rounded-2xl px-4 py-3 flex items-center justify-center",
        style: {
          background: "transparent",
        },
      }}
    />
    </div>
  );
}
