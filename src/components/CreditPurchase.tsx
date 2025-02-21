import { useState } from 'react';
import { creditsService } from '@/services/trial';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircleIcon, ChartBarIcon, EnvelopeIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

export default function CreditPurchase() {
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  
  const creditPackages = creditsService.getCreditPackages();

  const calculateMetrics = (credits: number) => {
    const expectedOpens = Math.round(credits * 0.25); // 25% open rate
    const expectedClicks = Math.round(credits * 0.08); // 8% click rate
    const expectedSales = Math.round(credits * 0.02); // 2% conversion
    const potentialRevenue = expectedSales * 35; // $35 average order value
    const roi = ((potentialRevenue - pkg.price) / pkg.price * 100).toFixed(0);
    return { expectedOpens, expectedClicks, expectedSales, potentialRevenue, roi };
  };

  const handlePurchase = async () => {
    if (!selectedPackage || !user) return;
    setLoading(true);
    
    try {
      await creditsService.addCredits(user.uid, selectedPackage);
      setSelectedPackage(null);
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Dropshipping Email Marketing Packages</h2>
        <p className="mt-2 text-gray-600">Scale your dropshipping business with targeted email marketing</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {creditPackages.map((pkg, index) => {
          const metrics = calculateMetrics(pkg.credits);
          return (
            <div
              key={index}
              className={`border rounded-lg p-6 cursor-pointer transition-all ${
                selectedPackage === index
                  ? 'border-indigo-600 bg-indigo-50 transform scale-105'
                  : 'border-gray-200 hover:border-indigo-300'
              }`}
              onClick={() => setSelectedPackage(index)}
            >
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{pkg.credits.toLocaleString()}</div>
                <div className="text-sm text-gray-500">Targeted Contacts</div>
                <div className="mt-2 text-2xl font-bold text-indigo-600">
                  ${pkg.price}
                </div>
                <div className="text-xs text-gray-500">
                  ${(pkg.price / pkg.credits).toFixed(4)} per contact
                </div>

                {/* Potential Results */}
                <div className="mt-4 space-y-2 text-left">
                  <div className="flex items-center text-sm">
                    <EnvelopeIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span>~{metrics.expectedOpens.toLocaleString()} Opens</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <ChartBarIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span>~{metrics.expectedClicks.toLocaleString()} Shop Visits</span>
                  </div>
                  <div className="flex items-center text-sm font-medium text-green-600">
                    <ShoppingCartIcon className="h-4 w-4 text-green-500 mr-2" />
                    <span>~{metrics.expectedSales.toLocaleString()} Potential Orders</span>
                  </div>
                  <div className="flex items-center text-sm font-medium text-green-600">
                    <span className="text-lg">💰</span>
                    <span className="ml-2">~${metrics.potentialRevenue.toLocaleString()} Revenue</span>
                  </div>
                  <div className="mt-2 py-1 px-2 bg-green-50 rounded text-sm text-green-700">
                    Potential ROI: {metrics.roi}x
                  </div>
                </div>

                {/* Features */}
                <div className="mt-4 pt-4 border-t">
                  <ul className="text-left space-y-2">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-start text-sm">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {index === 1 && (
                  <div className="mt-4 py-1 bg-indigo-100 text-indigo-700 text-sm rounded-full">
                    Most Popular
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={handlePurchase}
          disabled={loading || selectedPackage === null}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Start Selling'}
        </button>
      </div>

      {/* Dropshipping Success Tips */}
      <div className="mt-12 border-t pt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Maximize Your Dropshipping Success</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-indigo-600">High-Converting Contacts</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">Ready-to-buy shoppers</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">Niche-specific targeting</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-indigo-600">Proven Templates</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">High-converting email templates</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">Product showcase optimized</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium text-indigo-600">Profit Maximization</h4>
            <ul className="space-y-2">
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">Sales funnel optimization</span>
              </li>
              <li className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-sm text-gray-600">Abandoned cart recovery</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          Based on dropshipping industry averages: 25% open rate, 8% click rate, 2% conversion rate. Average order value: $35
        </div>
      </div>
    </div>
  );
} 