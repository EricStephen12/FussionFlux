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

const features = [
  {
    name: 'Smart Lead Generation',
    description: 'Get fresh, verified leads from your target niche using our proprietary technology.',
    icon: EnvelopeIcon,
  },
  {
    name: 'Campaign Analytics',
    description: 'Track open rates, click rates, and ROI with detailed analytics.',
    icon: ChartPieIcon,
  },
  {
    name: 'Flexible Payments',
    description: 'Multiple secure payment options to suit your business needs.',
    icon: CreditCardIcon,
  },
  {
    name: 'Enterprise Security',
    description: 'Bank-level security with advanced authentication and encryption.',
    icon: ShieldCheckIcon,
  },
];

const testimonials = [
  {
    content: "This platform has revolutionized our dropshipping email marketing. We've seen a 300% increase in response rates.",
    author: "Sarah Johnson",
    role: "E-commerce Entrepreneur",
    company: "Fashion Finds Co.",
  },
  {
    content: "The targeted email lists are incredibly accurate. It's saved us countless hours in lead generation.",
    author: "Michael Chen",
    role: "Marketing Director",
    company: "Tech Gadgets Direct",
  },
  {
    content: "Best investment we've made for our dropshipping business. The ROI tracking is phenomenal.",
    author: "David Smith",
    role: "CEO",
    company: "Home Essentials Plus",
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
    <main className="flex-grow">
      {/* Hero Section */}
      <section className="hero-section min-h-[80vh] flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-indigo-50 via-purple-50 to-white">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="container-lg relative z-10">
          <div className="text-center hero-content max-w-4xl mx-auto px-4">
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-8 animate-fade-in shadow-sm">
              <span className="badge text-sm font-medium text-indigo-600">Latest Updates</span>
              <span className="text-sm text-indigo-600">Just shipped v1.0</span>
              <ArrowRightIcon className="h-4 w-4 text-indigo-600" />
            </div>
            
            <h1 className="hero-title mb-8">
              <span className="block text-5xl sm:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent drop-shadow-sm">
                Supercharge Your
              </span>
              <span className="block text-5xl sm:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-indigo-700 via-purple-600 to-indigo-600 bg-clip-text text-transparent drop-shadow-sm mt-2">
                Dropshipping Email
              </span>
              <span className="block text-5xl sm:text-6xl lg:text-7xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent drop-shadow-sm mt-2">
              Marketing
              </span>
            </h1>
            
            <p className="hero-subtitle text-xl sm:text-2xl text-gray-600 max-w-2xl mx-auto mb-12">
              Get targeted email lists, automated campaigns, and powerful analytics to scale 
              your dropshipping business. Start reaching the right customers today.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link 
                href="/login" 
                className="btn-primary w-full sm:w-auto text-lg px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Get started
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                href="/pricing" 
                className="btn-secondary w-full sm:w-auto text-lg px-8 py-4 bg-white hover:bg-gray-50 text-indigo-600 hover:text-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                View pricing →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Partners Section */}
      <section className="py-12 bg-white/90 backdrop-blur-sm border-y border-gray-100">
        <div className="container-lg px-4">
          <div className="text-center mb-8">
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide">Trusted Partners</p>
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
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="container-lg">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="section-title">
              Everything you need to succeed
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
              Powerful features to help you find and connect with your ideal customers
            </p>
          </div>

          <div className="grid-responsive">
            <div className="feature-card">
              <EnvelopeIcon className="feature-icon" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                Smart Email Lists
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Get highly targeted email lists of potential customers in your niche.
              </p>
            </div>

            <div className="feature-card">
              <CursorArrowRaysIcon className="feature-icon" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                Automated Campaigns
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Set up automated email sequences that convert subscribers into customers.
              </p>
            </div>

            <div className="feature-card">
              <ChartBarIcon className="feature-icon" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                Advanced Analytics
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                Track performance and optimize your campaigns with detailed insights.
              </p>
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

      {/* Founder Section */}
      <section className="py-16 bg-white">
        <div className="container-lg px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="mb-8">
              <span className="inline-block px-4 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-4">
                Meet the Founder
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mb-4">
                ES
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Eric Stephen</h3>
              <p className="text-gray-600 mb-6">
                Founder & CEO of FussionFlux
              </p>
              <p className="text-gray-600 max-w-2xl mx-auto">
                "I built FussionFlux to solve the real challenges I faced in dropshipping. Our platform is designed to help entrepreneurs scale their businesses through powerful email marketing automation."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Regular User Testimonials */}
      <section className="testimonials-section">
        <div className="container-lg">
          <div className="text-center mb-12">
            <h2 className="section-title">
              What Our Users Say
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mt-4 max-w-2xl mx-auto">
              Join thousands of successful dropshippers who trust FussionFlux
            </p>
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
            <p className="text-base sm:text-lg text-gray-600 mb-8 max-w-xl mx-auto">
              Join thousands of successful dropshippers who are scaling their business with our platform.
            </p>
            <Link href="/login" className="btn-primary w-full sm:w-auto">
              Start your free trial
              <ArrowRightIcon className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
} 