import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, AlertTriangle, Upload, DollarSign, Users, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { showGlobalError, showGlobalSuccess } from '../components/CustomAlert';

export default function BecomeVendor() {
  const [currentStep, setCurrentStep] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [isAlreadyVendor, setIsAlreadyVendor] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    description: '',
    website: '',
    experience: '',
    categories: [] as string[],
    documents: [] as File[]
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const steps = [
    { id: 1, title: 'Business Information', icon: Users },
    { id: 2, title: 'Verification Documents', icon: Shield },
    { id: 3, title: 'Review & Submit', icon: CheckCircle }
  ];

  const categories = [
    'Digital Assets', 'Security Tools', 'Electronics', 
    'Books & Media', 'Services', 'Collectibles'
  ];

  const benefits = [
    { icon: DollarSign, title: 'Low Fees', description: 'Only 1.5-2.5% transaction fees' },
    { icon: Shield, title: 'Secure Platform', description: 'Military-grade encryption and security' },
    { icon: Users, title: 'Global Reach', description: 'Access to worldwide customer base' },
    { icon: Star, title: 'Reputation System', description: 'Build trust through verified reviews' }
  ];

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      setUser(user);

      // Check if user already has a profile and vendor status
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (profile) {
        if (profile.is_vendor) {
          setIsAlreadyVendor(true);
        }
      } else {
        // Create profile if it doesn't exist
        const { error: createError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            username: user.email?.split('@')[0] || 'user',
            email: user.email || '',
            is_vendor: false,
            is_admin: false,
            vendor_status: 'pending',
            reputation_score: 0.0
          }]);

        if (createError) {
          console.error('Error creating profile:', createError);
        }
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...Array.from(e.target.files!)]
      }));
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      showGlobalError('You must be logged in to apply as a vendor. Redirecting to login...');
      navigate('/login');
      return;
    }

    // Validate required fields
    if (!formData.businessName.trim()) {
      showGlobalError('Business name is required');
      return;
    }
    if (!formData.businessType) {
      showGlobalError('Please select a business type');
      return;
    }
    if (!formData.description.trim()) {
      showGlobalError('Business description is required');
      return;
    }
    if (!formData.experience) {
      showGlobalError('Please select your years of experience');
      return;
    }
    if (formData.categories.length === 0) {
      showGlobalError('Please select at least one product category');
      return;
    }
    if (currentStep === 2 && formData.documents.length === 0) {
      showGlobalError('Please upload at least one verification document');
      return;
    }
    setSubmitting(true);
    try {
      // Update user profile to vendor status
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_vendor: true,
          vendor_status: 'pending',
          vendor_type: 'escrow'
        })
        .eq('id', user.id);

      if (error) throw error;

      // Here you would typically upload documents and create vendor profile
  
      
      showGlobalSuccess('Vendor application submitted successfully! We will review your application within 24-48 hours.');
      navigate('/');
      
    } catch (error) {
      console.error('Error submitting vendor application:', error);
      showGlobalError('Error submitting application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-green-400 text-lg">Loading...</div>
      </div>
    );
  }

  if (isAlreadyVendor) {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-green-400 mb-4">You're Already a Vendor!</h1>
        <p className="text-gray-400 mb-6">You already have vendor status on this platform.</p>
        <button
          onClick={() => navigate('/admin')}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded font-bold transition-colors"
        >
          GO TO ADMIN PANEL
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-red-400 mb-4">BECOME A VENDOR</h1>
        <p className="text-gray-400">Join our secure marketplace and start selling to privacy-conscious customers</p>
      </div>

      {/* Benefits */}
      <div className="grid md:grid-cols-4 gap-6 mb-12">
        {benefits.map((benefit, index) => (
          <div key={index} className="bg-gray-900 border border-green-500 rounded-lg p-6 text-center">
            <div className="bg-red-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <benefit.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-green-400 mb-2">{benefit.title}</h3>
            <p className="text-gray-400 text-sm">{benefit.description}</p>
          </div>
        ))}
      </div>

      {/* Application Form */}
      <div className="bg-gray-900 border border-green-500 rounded-lg overflow-hidden">
        {/* Progress Steps */}
        <div className="bg-gray-800 p-6 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center gap-3 ${
                  currentStep >= step.id ? 'text-green-400' : 'text-gray-500'
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                    currentStep >= step.id 
                      ? 'border-green-400 bg-green-400 text-black' 
                      : 'border-gray-500'
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <step.icon className="w-5 h-5" />
                    )}
                  </div>
                  <span className="font-bold text-sm">{step.title}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-green-400' : 'bg-gray-600'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white mb-6">Business Information</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-green-400 text-sm mb-2">Business Name *</label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                    placeholder="Your business or brand name..."
                  />
                </div>
                <div>
                  <label className="block text-green-400 text-sm mb-2">Business Type *</label>
                  <select
                    value={formData.businessType}
                    onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                  >
                    <option value="">Select business type...</option>
                    <option value="individual">Individual Seller</option>
                    <option value="small-business">Small Business</option>
                    <option value="corporation">Corporation</option>
                    <option value="non-profit">Non-Profit</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-green-400 text-sm mb-2">Business Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                  placeholder="Describe your business, products, and services..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-green-400 text-sm mb-2">Website (Optional)</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                    placeholder="https://your-website.com"
                  />
                </div>
                <div>
                  <label className="block text-green-400 text-sm mb-2">Years of Experience *</label>
                  <select
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="w-full bg-black border border-gray-600 text-green-400 p-3 rounded focus:border-green-500 focus:outline-none"
                  >
                    <option value="">Select experience...</option>
                    <option value="0-1">0-1 years</option>
                    <option value="1-3">1-3 years</option>
                    <option value="3-5">3-5 years</option>
                    <option value="5+">5+ years</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-green-400 text-sm mb-2">Product Categories *</label>
                <div className="grid md:grid-cols-3 gap-3">
                  {categories.map((category) => (
                    <label key={category} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.categories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        className="w-4 h-4 text-green-400 bg-black border-gray-600 rounded focus:ring-green-500"
                      />
                      <span className="text-gray-300 text-sm">{category}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white mb-6">Verification Documents</h3>
              
              <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-1" />
                  <div>
                    <h4 className="font-bold text-yellow-400 mb-2">Document Requirements</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Government-issued ID (passport, driver's license)</li>
                      <li>• Business registration documents (if applicable)</li>
                      <li>• Proof of address (utility bill, bank statement)</li>
                      <li>• Tax identification documents</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-green-400 text-sm mb-2">Upload Documents *</label>
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">
                    Drag and drop files here, or click to select
                  </p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-bold cursor-pointer transition-colors"
                  >
                    SELECT FILES
                  </label>
                </div>
                
                {formData.documents.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-bold text-white mb-2">Uploaded Files:</h4>
                    <div className="space-y-2">
                      {formData.documents.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span>{file.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-white mb-6">Review & Submit</h3>
              
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h4 className="font-bold text-green-400 mb-4">Application Summary</h4>
                <div className="grid md:grid-cols-2 gap-6 text-sm">
                  <div>
                    <span className="text-gray-400">Business Name:</span>
                    <div className="text-white">{formData.businessName}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Business Type:</span>
                    <div className="text-white">{formData.businessType}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Experience:</span>
                    <div className="text-white">{formData.experience}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">Documents:</span>
                    <div className="text-white">{formData.documents.length} files uploaded</div>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-400">Categories:</span>
                    <div className="text-white">{formData.categories.join(', ')}</div>
                  </div>
                </div>
              </div>

              <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-1" />
                  <div>
                    <h4 className="font-bold text-green-400 mb-2">Next Steps</h4>
                    <ul className="text-gray-300 text-sm space-y-1">
                      <li>• Your application will be reviewed within 24-48 hours</li>
                      <li>• You'll receive an email notification about the status</li>
                      <li>• Once approved, you can start listing products</li>
                      <li>• Our team may contact you for additional information</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-green-400 px-6 py-3 rounded font-bold transition-colors"
            >
              PREVIOUS
            </button>
            
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded font-bold transition-colors"
              >
                NEXT
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-700 text-white px-8 py-3 rounded font-bold transition-colors"
              >
                {submitting ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}