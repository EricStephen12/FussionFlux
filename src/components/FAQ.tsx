'use client';

import { useState } from 'react';
import { Disclosure, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const faqs = [
  {
    question: "How accurate is your lead generation?",
    answer: "Our proprietary lead discovery system uses advanced machine learning algorithms to identify and qualify potential customers with exceptional accuracy. We maintain strict quality standards to ensure you receive only verified, high-quality leads."
  },
  {
    question: "What makes your email delivery system reliable?",
    answer: "Our enterprise-grade email delivery infrastructure is built on cutting-edge technology that ensures maximum deliverability. We continuously monitor and optimize delivery rates through our proprietary systems."
  },
  {
    question: "How fresh are your contact databases?",
    answer: "Our real-time verification system continuously updates and validates contact information. We employ multiple proprietary verification layers to maintain the highest data quality standards in the industry."
  },
  {
    question: "Can I bring my existing contacts?",
    answer: "Yes! Our platform includes advanced contact management capabilities. We automatically validate and optimize your existing lists while ensuring full compliance with privacy regulations and industry standards."
  },
  {
    question: "What kind of automation features do you offer?",
    answer: "Our intelligent automation system allows you to create sophisticated, behavior-driven email campaigns. Set up complex workflows with our intuitive interface - no technical expertise required."
  },
  {
    question: "How detailed are your analytics?",
    answer: "Our comprehensive analytics suite provides deep insights into campaign performance. Track key metrics, understand audience behavior, and receive AI-powered suggestions to optimize your campaigns."
  },
  {
    question: "How do you protect our data?",
    answer: "Security is our top priority. We utilize bank-level encryption, maintain strict access controls, and regularly undergo security audits. Your data is protected by multiple layers of enterprise-grade security measures."
  },
  {
    question: "What sets FussionFlux apart?",
    answer: "We've built a unique platform specifically for dropshippers, combining proprietary technologies with deep industry expertise. Our solution offers unmatched lead quality, superior deliverability, and automated campaign optimization - all designed to maximize your success."
  }
];

export default function FAQ() {
  return (
    <div className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl divide-y divide-gray-900/10">
          <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900 text-center mb-10">
            Frequently Asked Questions
          </h2>
          <dl className="mt-10 space-y-6 divide-y divide-gray-900/10">
            {faqs.map((faq, index) => (
              <Disclosure as="div" key={index} className="pt-6">
                {({ open }) => (
                  <>
                    <dt>
                      <Disclosure.Button className="flex w-full items-start justify-between text-left text-gray-900">
                        <span className="text-base font-semibold leading-7">
                          {faq.question}
                        </span>
                        <span className="ml-6 flex h-7 items-center">
                          <ChevronDownIcon
                            className={`h-6 w-6 transform transition-transform duration-200 ${
                              open ? 'rotate-180' : ''
                            }`}
                            aria-hidden="true"
                          />
                        </span>
                      </Disclosure.Button>
                    </dt>
                    <Transition
                      enter="transition duration-100 ease-out"
                      enterFrom="transform scale-95 opacity-0"
                      enterTo="transform scale-100 opacity-100"
                      leave="transition duration-75 ease-out"
                      leaveFrom="transform scale-100 opacity-100"
                      leaveTo="transform scale-95 opacity-0"
                    >
                      <Disclosure.Panel as="dd" className="mt-2 pr-12">
                        <p className="text-base leading-7 text-gray-600">
                          {faq.answer}
                        </p>
                      </Disclosure.Panel>
                    </Transition>
                  </>
                )}
              </Disclosure>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
} 

import { useState } from 'react';
import { Disclosure, Transition } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

const faqs = [
  {
    question: "How accurate is your lead generation?",
    answer: "Our proprietary lead discovery system uses advanced machine learning algorithms to identify and qualify potential customers with exceptional accuracy. We maintain strict quality standards to ensure you receive only verified, high-quality leads."
  },
  {
    question: "What makes your email delivery system reliable?",
    answer: "Our enterprise-grade email delivery infrastructure is built on cutting-edge technology that ensures maximum deliverability. We continuously monitor and optimize delivery rates through our proprietary systems."
  },
  {
    question: "How fresh are your contact databases?",
    answer: "Our real-time verification system continuously updates and validates contact information. We employ multiple proprietary verification layers to maintain the highest data quality standards in the industry."
  },
  {
    question: "Can I bring my existing contacts?",
    answer: "Yes! Our platform includes advanced contact management capabilities. We automatically validate and optimize your existing lists while ensuring full compliance with privacy regulations and industry standards."
  },
  {
    question: "What kind of automation features do you offer?",
    answer: "Our intelligent automation system allows you to create sophisticated, behavior-driven email campaigns. Set up complex workflows with our intuitive interface - no technical expertise required."
  },
  {
    question: "How detailed are your analytics?",
    answer: "Our comprehensive analytics suite provides deep insights into campaign performance. Track key metrics, understand audience behavior, and receive AI-powered suggestions to optimize your campaigns."
  },
  {
    question: "How do you protect our data?",
    answer: "Security is our top priority. We utilize bank-level encryption, maintain strict access controls, and regularly undergo security audits. Your data is protected by multiple layers of enterprise-grade security measures."
  },
  {
    question: "What sets FussionFlux apart?",
    answer: "We've built a unique platform specifically for dropshippers, combining proprietary technologies with deep industry expertise. Our solution offers unmatched lead quality, superior deliverability, and automated campaign optimization - all designed to maximize your success."
  }
];

export default function FAQ() {
  return (
    <div className="bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl divide-y divide-gray-900/10">
          <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900 text-center mb-10">
            Frequently Asked Questions
          </h2>
          <dl className="mt-10 space-y-6 divide-y divide-gray-900/10">
            {faqs.map((faq, index) => (
              <Disclosure as="div" key={index} className="pt-6">
                {({ open }) => (
                  <>
                    <dt>
                      <Disclosure.Button className="flex w-full items-start justify-between text-left text-gray-900">
                        <span className="text-base font-semibold leading-7">
                          {faq.question}
                        </span>
                        <span className="ml-6 flex h-7 items-center">
                          <ChevronDownIcon
                            className={`h-6 w-6 transform transition-transform duration-200 ${
                              open ? 'rotate-180' : ''
                            }`}
                            aria-hidden="true"
                          />
                        </span>
                      </Disclosure.Button>
                    </dt>
                    <Transition
                      enter="transition duration-100 ease-out"
                      enterFrom="transform scale-95 opacity-0"
                      enterTo="transform scale-100 opacity-100"
                      leave="transition duration-75 ease-out"
                      leaveFrom="transform scale-100 opacity-100"
                      leaveTo="transform scale-95 opacity-0"
                    >
                      <Disclosure.Panel as="dd" className="mt-2 pr-12">
                        <p className="text-base leading-7 text-gray-600">
                          {faq.answer}
                        </p>
                      </Disclosure.Panel>
                    </Transition>
                  </>
                )}
              </Disclosure>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
} 