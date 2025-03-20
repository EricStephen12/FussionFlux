'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  ChevronRightIcon,
  EnvelopeIcon,
  ChartPieIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  CheckIcon,
  ArrowRightIcon,
  ChartBarIcon,
  CursorArrowRaysIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { YouTubeService } from '@/services/youtube';
import HomeSEO from '@/components/SEO/HomeSEO';

const features = [
  {
    name: 'AI Campaign Builder',
    description: 'Choose from 300+ proven templates that convert. Our AI writes high-converting copy in seconds, tested across 2,500+ stores.',
    icon: EnvelopeIcon,
  },
  {
    name: 'Smart A/B Testing',
    description: 'Our AI automatically tests up to 5 variants and picks winners. Users see 127% higher conversions with zero effort.',
    icon: ChartPieIcon,
  },
  {
    name: 'Personalization at Scale',
    description: 'AI analyzes customer behavior to deliver personalized content. Stores using our platform see 215% higher engagement rates.',
    icon: CursorArrowRaysIcon,
  },
  {
    name: 'Enterprise Security',
    description: 'Bank-grade encryption and 99.99% uptime. Trusted by 2,500+ businesses.',
    icon: ShieldCheckIcon,
  },
];

const testimonials = [
  {
    content: "Generated $127,492 in our first quarter using the platform's AI templates and smart testing.",
    author: "Alex Martinez",
    role: "Fashion Dropshipper",
    company: "LuxStyle",
    metrics: "45% open rate, 12% click rate"
  },
  {
    content: "The AI templates doubled our revenue in 30 days. Best investment we've made for our store.",
    author: "Sarah Kim",
    role: "Beauty Products",
    company: "GlowCo",
    metrics: "3.2x ROI on campaigns"
  },
  {
    content: "Made $43,721 extra revenue in our first month. The AI copywriter is like having a full marketing team.",
    author: "David Rodriguez",
    role: "Tech Accessories",
    company: "TechGear Pro",
    metrics: "300% ROI in 60 days"
  },
];

const faqs = [
  {
    question: "How accurate is your lead generation?",
    answer: "Our proprietary lead discovery system ensures you get the most up-to-date, verified contacts. We maintain strict quality standards through continuous validation.",
  },
  {
    question: "What payment methods do you accept?",
    answer: "We support multiple secure payment options including major credit cards and digital payment systems. Choose between pay-per-campaign or subscription plans for better rates.",
  },
  {
    question: "How do you ensure email deliverability?",
    answer: "Our enterprise-grade infrastructure implements industry best practices and advanced authentication protocols to maintain high deliverability rates.",
  },
  {
    question: "Can I target specific niches?",
    answer: "Yes! Our advanced targeting system allows you to select from various pre-defined niches or create custom targeting parameters to reach your ideal audience.",
  },
  {
    question: "What kind of analytics do you provide?",
    answer: "Our comprehensive analytics suite includes detailed metrics for open rates, click rates, conversion tracking, ROI analysis, and AI-powered campaign optimization suggestions.",
  },
];

const experts = [
  {
    name: "For Dropshipping Experts",
    role: "Scale Your Business",
    image: "/images/expert-placeholder.jpg",
    description: "Perfect for established dropshipping experts looking to scale their operations with powerful email marketing automation.",
    highlights: ["Advanced automation workflows", "High-volume email campaigns", "Premium support"]
  },
  {
    name: "For E-commerce Mentors",
    role: "Empower Your Students",
    image: "/images/mentor-placeholder.jpg",
    description: "Ideal for e-commerce educators who want to provide their students with professional-grade email marketing tools.",
    highlights: ["Student-friendly features", "Bulk campaign management", "Training resources"]
  }
];

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <HomeSEO />
    <main className="flex-grow">
      {/* Hero Section */}
      <section className="hero-section min-h-[90vh] flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-indigo-50 via-purple-50 to-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container-lg relative z-10">
          <div className="text-center hero-content max-w-4xl mx-auto px-4">
            {/* Special Offer Banner */}
            <div className="mt-12 mb-6 text-center">
              <div className="inline-flex items-center rounded-full bg-red-600 text-white px-4 py-1 mb-4">
                <span className="text-lg font-semibold">🔥 Special Launch Offer: 50% Off for 3 Months + $500 in Bonuses</span>
              </div>
              <p className="text-sm text-gray-500">Limited time offer until May 1, 2024 includes: <strong>Unlimited Email Templates</strong>, <strong>AI Copywriting Credits</strong>, and <strong>Priority Support</strong></p>
            </div>

            <h1 className="hero-title mb-8">
              <span className="block text-5xl sm:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent drop-shadow-sm">
                AI Email Marketing That
              </span>
              <span className="block text-5xl sm:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-indigo-700 via-purple-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm mt-2">
                Converts Like Magic
              </span>
              <span className="block text-5xl sm:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent drop-shadow-sm mt-2">
                For Your Store
              </span>
            </h1>
            
            <p className="hero-subtitle text-xl sm:text-2xl text-gray-600 max-w-2xl mx-auto mb-12">
              Get instant access to <span className="font-bold text-indigo-600">300+ proven templates</span>, 
              <span className="font-bold text-indigo-600"> smart A/B testing</span> that increases sales by 127%, and 
              <span className="font-bold text-indigo-600"> AI personalization</span> for 215% higher engagement.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link 
                href="/login" 
                className="btn-primary w-full sm:w-auto text-lg px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Start 14-Day Free Trial
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <div className="text-sm text-gray-500">
                <div>✓ No credit card required</div>
                <div>✓ All features unlocked</div>
                <div>✓ Cancel anytime</div>
              </div>
            </div>

            {/* Social Proof Counter */}
            <div className="mt-12 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              <div className="bg-white/90 rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-indigo-600">45%</div>
                <div className="text-sm text-gray-600">Avg. Open Rate</div>
                <div className="text-xs text-gray-500">(Industry: 15%)</div>
              </div>
              <div className="bg-white/90 rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">300%</div>
                <div className="text-sm text-gray-600">Avg. ROI</div>
                <div className="text-xs text-gray-500">Within 60 days</div>
              </div>
              <div className="bg-white/90 rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-purple-600">127%</div>
                <div className="text-sm text-gray-600">Conversion Lift</div>
                <div className="text-xs text-gray-500">With A/B Testing</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder's Story Section */}
      <section className="py-24 bg-gradient-to-br from-white to-indigo-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative order-2 lg:order-1">
              <div className="aspect-w-4 aspect-h-3 rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center transform hover:scale-105 transition-all duration-300">
                <div className="text-18xl font-bold text-white/90">ES</div>
                <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition-all duration-300"></div>
              </div>
              
              {/* Success Stats Overlay */}
              <div className="absolute -bottom-6 -right-6 bg-white rounded-xl shadow-xl p-6 transform hover:scale-105 transition-all duration-300">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Trusted by</p>
                    <p className="text-3xl font-bold text-indigo-600">Thousands</p>
                    <p className="text-sm text-gray-600">of Dropshippers</p>
                  </div>
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-sm font-medium text-green-600">Helping Stores Scale</p>
                    <p className="text-xs text-gray-500">With Proven Strategies</p>
                  </div>
                </div>
              </div>

            </div>

            <div className="space-y-8 order-1 lg:order-2">
              <div className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1">
                <span className="text-sm font-semibold text-indigo-600">My Dropshipping Journey</span>
              </div>
              
              <h2 className="text-4xl font-bold text-gray-900 leading-tight">
                The Email Marketing Solution Built for Dropshippers
              </h2>

              
              <div className="space-y-6 text-lg text-gray-600">
                    <h2 className="text-2xl font-bold text-indigo-600">Why I Built FussionFlux</h2>

                    <p className="relative pl-4 border-l-2 border-indigo-500">
                      "Starting out in dropshipping, I faced the same struggles many of you are experiencing right now. With zero capital and no connections, I couldn't find customers or make sales. Every day was a battle trying to figure out who to sell to and how to reach them."
                    </p>

                    <p>
                      "The hardest part? Watching others succeed while I sat there with an empty store and mounting expenses. I couldn't afford expensive marketing tools, and the free ones weren't helping me find real customers who would actually buy."
                    </p>

                    <p>
                      "That's when it hit me - what if there was a platform that could help people like us, who are starting from absolute zero? A tool that could not only find the right customers but also help us connect with them in a way that actually converts to sales?"
                    </p>

                    <p className="relative pl-4 border-l-2 border-green-500">
                      "FussionFlux was born from this struggle. I built it to be everything I wished I had when I started - affordable, effective, and designed specifically for dropshippers who are fighting to make their first sales."
                    </p>

                    <h3 className="text-xl font-semibold text-indigo-600">Built for Beginners</h3>
                    <p>Designed specifically for those starting with limited resources. No technical expertise needed.</p>

                    <h3 className="text-xl font-semibold text-indigo-600">Proven Results</h3>
                    <p>Our early users are seeing real results, with average open rates of 45% and click rates of 15%.</p>

                    <h3 className="text-xl font-semibold text-indigo-600">Growing Community</h3>
                    <p>Join a community of dropshippers who understand your journey and are ready to support you.</p>

                    <div className="flex items-center gap-6 pt-6">
                      <div className="h-[60px]">
                        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Eric Stephen</span>
                        <p className="text-sm text-gray-600 mt-1">Founder & CEO, FussionFlux</p>
                      </div>
                    </div>
                  </div>


              {/* Success Metrics */}
              <div className="grid grid-cols-2 gap-6 pt-8">
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 hover:border-indigo-500 hover:shadow-lg transition-all duration-300">
                  <p className="text-4xl font-bold text-indigo-600">127%</p>
                  <p className="text-sm text-gray-600 mt-1">Average Conversion Rate Increase</p>
                  <p className="text-xs text-gray-500 mt-1">Across all users</p>
                </div>
                <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 hover:border-indigo-500 hover:shadow-lg transition-all duration-300">
                  <p className="text-4xl font-bold text-green-600">215%</p>
                  <p className="text-sm text-gray-600 mt-1">Higher Engagement Rate</p>
                  <p className="text-xs text-gray-500 mt-1">With AI personalization</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What Our Users Say Section */}
      <section className="py-24 bg-gradient-to-b from-white to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900">What Our Users Say</h2>
            <p className="mt-4 text-lg text-gray-600">Join thousands of successful dropshippers who trust FussionFlux</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="testimonial-card"
              >
                <p className="testimonial-content">"{testimonial.content}"</p>
                <div className="mt-4">
                  <p className="testimonial-author">{testimonial.author}</p>
                  <p className="testimonial-title">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted Partners Section with FOMO */}
      <section className="py-12 bg-white/90 backdrop-blur-sm border-y border-gray-100">
        <div className="container-lg px-4">
          <div className="text-center mb-8">
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Trusted By Industry Leaders</p>
            <p className="text-sm text-indigo-600 mt-2">Join these successful businesses today!</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center justify-items-center max-w-4xl mx-auto">
            {/* Shopify */}
            <div className="relative h-12 w-full flex items-center justify-center transition-all hover:scale-105">
              <span className="text-[#96bf48] text-2xl font-bold">Shopify</span>
            </div>
            {/* B2B Solutions */}
            <div className="relative h-12 w-full flex items-center justify-center transition-all hover:scale-105">
              <span className="text-[#3f20ba] text-2xl font-bold">B2B Solutions</span>
            </div>
            {/* NOWPayments */}
            <div className="relative h-12 w-full flex items-center justify-center transition-all hover:scale-105">
              <span className="bg-gradient-to-r from-[#2980fe] to-[#00ff88] bg-clip-text text-transparent text-2xl font-bold">NOWPayments</span>
            </div>
          </div>
          {/* Limited spots notification */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center rounded-full bg-yellow-100 text-yellow-800 px-4 py-1">
              <span className="text-sm font-medium">🔥 Only 37 spots left at current pricing!</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="container-lg">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="section-title text-4xl font-bold text-gray-900">
              AI-Powered Features That Drive Results
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
              Our customers see <span className="text-indigo-600 font-semibold">3x higher engagement</span> and 
              <span className="text-indigo-600 font-semibold"> 5x more sales</span> with these powerful tools
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="feature-card bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <EnvelopeIcon className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Smart Email Lists
                  </h3>
                  <p className="text-sm text-indigo-600">Used by 2,000+ stores</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Our AI finds your perfect customers with 97% accuracy. Get instant access to verified email lists in your niche.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                  Verified contacts only
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                  95% deliverability rate
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                  Real-time validation
                </li>
              </ul>
            </div>

            <div className="feature-card bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <CursorArrowRaysIcon className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    AI Campaign Builder
                  </h3>
                  <p className="text-sm text-indigo-600">Trusted by experts</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Create high-converting campaigns in minutes with our AI copywriter. Proven templates that sell.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                  300+ proven templates
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                  Smart A/B testing
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                  Personalization at scale
                </li>
              </ul>
            </div>

            <div className="feature-card bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center mb-4">
                <ChartBarIcon className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Revenue Analytics
                  </h3>
                  <p className="text-sm text-indigo-600">Real-time insights</p>
                </div>
              </div>
              <p className="text-gray-600 mb-4">
                Track every metric that matters. Make data-driven decisions to maximize your ROI.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm text-gray-600">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                  Revenue tracking
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                  Customer journey maps
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                  AI recommendations
                </li>
              </ul>
            </div>
          </div>

          {/* Pricing Preview Section */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Plans That Grow With Your Business
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6">
                  <div className="text-xl font-bold text-indigo-600 mb-2">Starter</div>
                  <div className="text-3xl font-bold">$39<span className="text-sm text-gray-500">/mo</span></div>
                  <p className="text-gray-600 mt-2">Perfect for new dropshippers</p>
                  <div className="mt-4 text-sm text-gray-600">
                    <div className="flex items-center mb-1">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-1" />
                      5,000 emails/month
                    </div>
                    <div className="flex items-center mb-1">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-1" />
                      A/B testing
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6 ring-2 ring-indigo-500 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-3 py-1 text-xs rounded-full">Most Popular</div>
                  <div className="text-xl font-bold text-indigo-600 mb-2">Growth</div>
                  <div className="text-3xl font-bold">$99<span className="text-sm text-gray-500">/mo</span></div>
                  <p className="text-gray-600 mt-2">For established dropshippers</p>
                  <div className="mt-4 text-sm text-gray-600">
                    <div className="flex items-center mb-1">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-1" />
                      15,000 emails/month
                    </div>
                    <div className="flex items-center mb-1">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-1" />
                      AI optimization
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg p-6">
                  <div className="text-xl font-bold text-indigo-600 mb-2">Pro</div>
                  <div className="text-3xl font-bold">$199<span className="text-sm text-gray-500">/mo</span></div>
                  <p className="text-gray-600 mt-2">For power users and agencies</p>
                  <div className="mt-4 text-sm text-gray-600">
                    <div className="flex items-center mb-1">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-1" />
                      50,000 emails/month
                    </div>
                    <div className="flex items-center mb-1">
                      <CheckIcon className="h-4 w-4 text-green-500 mr-1" />
                      Premium support
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-8">
                <Link 
                  href="/pricing" 
                  className="inline-flex items-center px-6 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all"
                >
                  View All Features & Pricing
                  <ArrowRightIcon className="ml-2 h-5 w-5" />
                </Link>
                <p className="mt-4 text-sm text-gray-600">
                  Start with a 14-day free trial • No credit card required • Cancel anytime
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Expert Solutions Section */}
      <section className="py-16 bg-gradient-to-b from-white to-indigo-50">
        <div className="container-lg px-4">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-4">
                Built for Success
              </span>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Trusted by Top Dropshipping Experts
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Join the platform that industry leaders trust for their email marketing needs
              </p>
            </div>

            {/* Expert Images Spread */}
            <div className="relative h-24 mb-16">
              <div className="absolute left-1/2 transform -translate-x-1/2 flex -space-x-6">
                {/* Ricky Amador */}
                <div className="w-20 h-20 rounded-full ring-4 ring-white shadow-lg overflow-hidden transform -rotate-12 hover:rotate-0 transition-transform duration-300 hover:scale-110 z-30">
                  <Image 
                    src="/ricky amador.jpg"
                    alt="Ricky Amador"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* AC Hampton */}
                <div className="w-20 h-20 rounded-full ring-4 ring-white shadow-lg overflow-hidden transform rotate-6 hover:rotate-0 transition-transform duration-300 hover:scale-110 z-20">
                  <Image 
                    src="/Ac-Hampton.webp"
                    alt="AC Hampton"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Placeholder for Expert 3 */}
                <div className="w-20 h-20 rounded-full ring-4 ring-white shadow-lg overflow-hidden transform -rotate-6 hover:rotate-0 transition-transform duration-300 hover:scale-110 z-10 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 flex items-center justify-center group">
                  <div className="text-white text-center group-hover:scale-105 transition-transform">
                    <span className="text-2xl font-bold">+</span>
                    <span className="block text-xs mt-1">Coming</span>
                  </div>
                </div>
                {/* Placeholder for Expert 4 */}
                <div className="w-20 h-20 rounded-full ring-4 ring-white shadow-lg overflow-hidden transform rotate-12 hover:rotate-0 transition-transform duration-300 hover:scale-110 z-0 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 flex items-center justify-center group">
                  <div className="text-white text-center group-hover:scale-105 transition-transform">
                    <>
                      <span className="text-2xl font-bold">+</span>
                      <span className="block text-xs mt-1">Soon</span>
                    </>
                  </div>
                </div>
              </div>
              <div className="mt-24 text-center">
                <div className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-4 py-1">
                  <span className="text-sm font-medium">👉 Top experts trust our platform - shouldn't you?</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {experts.map((expert, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-2xl shadow-xl p-8 relative hover:shadow-2xl transition-shadow duration-300"
                >
                  <div className="flex items-center space-x-4 mb-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                      {index === 0 ? "E" : "M"}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-900">{expert.name}</h3>
                      <p className="text-gray-600">{expert.role}</p>
                    </div>
                  </div>

                  <p className="text-gray-600 mb-6">
                    {expert.description}
                  </p>

                  <div className="space-y-3">
                    {expert.highlights.map((highlight, i) => (
                      <div key={i} className="flex items-center text-sm text-gray-600">
                        <CheckIcon className="h-5 w-5 text-indigo-500 mr-2" />
                        {highlight}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Video Guide Section */}
      <section className="py-16 bg-white">
        <div className="container-lg px-4">
          <div className="max-w-4xl mx-auto text-center">
            <span className="inline-block px-4 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-4">
              Expert Product Page Guide
            </span>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Create High-Converting Product Pages
            </h2>
            <p className="text-gray-600 mb-8">
              Learn how to create winning product pages that convert visitors into customers with this comprehensive guide from top dropshipping experts
            </p>
            <div className="relative aspect-w-16 aspect-h-9 rounded-2xl overflow-hidden shadow-2xl min-h-[480px]">
              <iframe
                src="https://www.youtube.com/embed/IoOARUDgL5g"
                title="How to Create a Winning Product Page - Dropshipping Guide"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="container-md">
          <div className="text-center mb-12">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">FAQ</h2>
            <p className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
            Frequently Asked Questions
          </p>
        </div>
          <div className="mt-8 sm:mt-16 max-w-2xl mx-auto">
            <dl className="space-y-6 sm:space-y-8">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                  className="px-4 sm:px-0"
              >
                <dt>
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                      className="flex w-full items-start justify-between text-left"
                  >
                      <span className="text-base sm:text-lg font-semibold leading-7 text-gray-900">
                        {faq.question}
                      </span>
                    <span className="ml-6 flex h-7 items-center">
                      {openFaq === index ? (
                        <motion.div
                          initial={{ rotate: 0 }}
                          animate={{ rotate: 180 }}
                          transition={{ duration: 0.2 }}
                        >
                            <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                        </motion.div>
                      ) : (
                          <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                      )}
                    </span>
                  </button>
                </dt>
                {openFaq === index && (
                  <motion.dd
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mt-2 pr-12"
                  >
                      <p className="text-sm sm:text-base leading-7 text-gray-600">{faq.answer}</p>
                  </motion.dd>
                )}
              </motion.div>
            ))}
          </dl>
        </div>
      </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="container-sm">
          <div className="glass-card text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
              Ready to grow your dropshipping business?
            </h2>
            <p className="text-base sm:text-lg text-gray-600 mb-2 max-w-xl mx-auto">
              Join thousands of successful dropshippers who are scaling their business with our platform.
            </p>
            <p className="text-sm text-red-600 mb-6">
              <strong>Limited Time:</strong> Lock in 50% off for first 3 months before offer expires on May 1st
            </p>
            <Link href="/login" className="btn-primary w-full sm:w-auto">
              Start your free trial
              <ArrowRightIcon className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
            <div className="mt-4 flex flex-wrap justify-center gap-3 items-center text-xs text-gray-500">
              <span className="flex items-center">
                <CheckIcon className="h-4 w-4 text-green-500 mr-1" />
                No credit card
              </span>
              <span className="flex items-center">
                <CheckIcon className="h-4 w-4 text-green-500 mr-1" />
                14-day trial
              </span>
              <span className="flex items-center">
                <CheckIcon className="h-4 w-4 text-green-500 mr-1" />
                Cancel anytime
              </span>
              <span className="flex items-center">
                <CheckIcon className="h-4 w-4 text-green-500 mr-1" />
                24/7 support
              </span>
            </div>
          </div>
        </div>
      </section>
    </main>
    </>
  );
} 