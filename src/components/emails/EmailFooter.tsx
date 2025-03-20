import React from 'react';

interface EmailFooterProps {
  unsubscribeUrl: string;
  companyName?: string;
  companyAddress?: string;
  campaignId?: string;
  showSocialLinks?: boolean;
}

/**
 * Standard email footer that includes all legally required elements:
 * - Unsubscribe link
 * - Physical address
 * - Company name
 */
export const EmailFooter: React.FC<EmailFooterProps> = ({
  unsubscribeUrl,
  companyName = 'Fussion Flux',
  companyAddress = '123 Marketing St, Tech City, TC 12345',
  showSocialLinks = true,
}) => {
  return (
    <div style={{
      margin: '20px 0 0',
      padding: '20px',
      borderTop: '1px solid #eaeaea',
      color: '#666666',
      fontSize: '12px',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
    }}>
      {showSocialLinks && (
        <div style={{ marginBottom: '15px' }}>
          <a href="https://twitter.com/fussionflux" style={{ margin: '0 10px', color: '#4F46E5' }}>Twitter</a>
          <a href="https://facebook.com/fussionflux" style={{ margin: '0 10px', color: '#4F46E5' }}>Facebook</a>
          <a href="https://instagram.com/fussionflux" style={{ margin: '0 10px', color: '#4F46E5' }}>Instagram</a>
          <a href="https://linkedin.com/company/fussionflux" style={{ margin: '0 10px', color: '#4F46E5' }}>LinkedIn</a>
        </div>
      )}

      <p style={{ margin: '10px 0' }}>
        You received this email because you signed up for {companyName} updates or made a purchase. We respect your privacy.
      </p>

      <p style={{ margin: '10px 0' }}>
        <a 
          href={unsubscribeUrl}
          style={{ 
            color: '#4F46E5',
            textDecoration: 'underline',
          }}
          target="_blank"
          rel="noopener noreferrer"
        >
          Unsubscribe
        </a>
        {' or '}
        <a 
          href="https://fussionflux.com/preferences"
          style={{ 
            color: '#4F46E5',
            textDecoration: 'underline',
          }}
          target="_blank"
          rel="noopener noreferrer"
        >
          manage your email preferences
        </a>
      </p>

      <p style={{ margin: '10px 0' }}>
        © {new Date().getFullYear()} {companyName}. All rights reserved.
      </p>
      
      <p style={{ margin: '10px 0' }}>
        {companyAddress}
      </p>
    </div>
  );
};

export default EmailFooter; 