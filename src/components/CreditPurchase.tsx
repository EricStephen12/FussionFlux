import { useState, useEffect } from 'react';
import { limitsService } from '@/services/trial';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircleIcon, ChartBarIcon, EnvelopeIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

export default function CreditPurchase() {
  const { user } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creditPackages, setCreditPackages] = useState<any[]>([]); // State for credit packages
  const [loadingPackages, setLoadingPackages] = useState<boolean>(true); // Loading state for credit packages

  useEffect(() => {
    const fetchCreditPackages = async () => {
      try {
        const packages = await limitsService.getLimitPackages();
        setCreditPackages(packages);
      } catch (error) {
        console.error('Error fetching credit packages:', error);
        setError('Failed to load credit packages. Please try again later.');
      } finally {
        setLoadingPackages(false); // Set loading to false
      }
    };

    fetchCreditPackages();
  }, []);

  const calculateMetrics = (limits: number, price: number) => {
    const expectedOpens = Math.round(limits * 0.25); // 25% open rate
    const expectedClicks = Math.round(limits * 0.08); // 8% click rate
    const expectedSales = Math.round(limits * 0.02); // 2% conversion
    const potentialRevenue = expectedSales * 35; // $35 average order value
    const roi = ((potentialRevenue - price) / price * 100).toFixed(0);
    return { expectedOpens, expectedClicks, expectedSales, potentialRevenue, roi };
  };

  const handlePurchase = async () => {
    if (!selectedPackage || !user) return;
    setLoading(true);
    setError(null);
    
    try {
      await limitsService.addLimits(user.uid, creditPackages[selectedPackage].limits);
      setSelectedPackage(null);
    } catch (error) {
      console.error('Purchase error:', error);
      setError('Failed to process your purchase. Please try again later.');
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
      {error && <p className="text-red-600 text-center">{error}</p>}
      {loadingPackages ? ( // Show loading message for credit packages
        <p className="text-center">Loading credit packages...</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {creditPackages.map((pkg, index) => {
            const metrics = calculateMetrics(pkg.limits, pkg.price);
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
                  <div className="text-3xl font-bold text-gray-900">{pkg.limits.toLocaleString()} Leads</div>
                  <div className="text-sm text-gray-500">Targeted Contacts</div>
                  <div className="mt-2 text-2xl font-bold text-indigo-600">
                    ${pkg.price}
                  </div>
                  <div className="text-xs text-gray-500">
                    ${(pkg.price / pkg.limits).toFixed(4)} per lead
                  </div>

                  {/* Expected Results */}
                  <div className="mt-4 space-y-2 text-left">
                    <h4 className="font-medium text-gray-900">Expected Results:</h4>
                    <p>With {pkg.limits} leads, you can expect approximately:</p>
                    <ul className="list-disc list-inside">
                      <li>~{metrics.expectedOpens.toLocaleString()} Opens</li>
                      <li>~{metrics.expectedClicks.toLocaleString()} Shop Visits</li>
                      <li>~{metrics.expectedSales.toLocaleString()} Potential Orders</li>
                      <li>~${metrics.potentialRevenue.toLocaleString()} Revenue</li>
                      <li>ROI: {metrics.roi}%</li>
                    </ul>
                  </div>

                  {/* Monthly Results */}
                  <div className="mt-4 space-y-2 text-left">
                    <h4 className="font-medium text-gray-900">Expected Monthly Results:</h4>
                    <ul className="list-disc list-inside">
                      <li>{pkg.stats.expectedOrders} Orders</li>
                      <li>${pkg.stats.potentialRevenue} Revenue</li>
                      <li>{pkg.stats.roi}x ROI</li>
                    </ul>
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
      )}

      <div className="mt-8 text-center">
        <button
          onClick={handlePurchase}
          disabled={loading || selectedPackage === null}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Start Selling'}
        </button>
      </div>

      {selectedPackage !== null && (
        <div className="mt-4 text-center text-gray-700">
          You will use <strong>{creditPackages[selectedPackage].limits.toLocaleString()}</strong> limits for this purchase.
        </div>
      )}

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