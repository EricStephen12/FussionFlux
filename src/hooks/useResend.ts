import { Resend } from 'resend';

const resend = new Resend(process.env.NEXT_PUBLIC_RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  subject: string;
  template: any;
}

export const useResend = () => {
  const sendEmail = async ({ to, subject, template }: SendEmailParams) => {
    try {
      const { data, error } = await resend.emails.send({
        from: 'noreply@yourdomain.com',
        to,
        subject,
        html: generateEmailHtml(template),
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error sending email with Resend:', error);
      throw error;
    }
  };

  const generateEmailHtml = (template: any) => {
    // Convert template blocks to HTML
    const blocksHtml = template.blocks
      .map((block: any) => {
        switch (block.type) {
          case 'hero':
            return `
              <div style="text-align: center; padding: 40px 20px; background-color: ${block.content.backgroundColor || '#f8fafc'}">
                <h1 style="font-size: 32px; margin-bottom: 16px;">${block.content.title}</h1>
                <p style="font-size: 18px; margin-bottom: 24px;">${block.content.subtitle}</p>
                ${block.content.imageUrl ? `<img src="${block.content.imageUrl}" alt="" style="max-width: 100%; margin-bottom: 24px;">` : ''}
                ${block.content.button ? `<a href="${block.content.button.url}" style="display: inline-block; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px;">${block.content.button.text}</a>` : ''}
              </div>
            `;
          case 'text':
            return `
              <div style="padding: 20px; background-color: ${block.content.backgroundColor || '#ffffff'}">
                <p style="color: ${block.content.color || '#000000'}; font-size: ${block.content.fontSize || '16px'}; text-align: ${block.content.align || 'left'};">
                  ${block.content.text}
                </p>
              </div>
            `;
          case 'image':
            return `
              <div style="padding: 20px;">
                <img src="${block.content.imageUrl}" alt="${block.content.alt || ''}" style="max-width: 100%; width: ${block.content.width || 'auto'}; height: ${block.content.height || 'auto'};">
              </div>
            `;
          case 'product':
            return `
              <div style="padding: 20px; background-color: ${block.content.backgroundColor || '#ffffff'}; border-radius: ${block.content.borderRadius || '0'}; ${block.content.boxShadow ? 'box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);' : ''}">
                <img src="${block.content.imageUrl}" alt="Product" style="width: 100%; height: auto; margin-bottom: 16px;">
                <h3 style="font-size: 20px; margin-bottom: 8px;">Product Title</h3>
                ${block.content.showPrice ? '<p style="font-size: 18px; font-weight: bold; margin-bottom: 8px;">$19.99</p>' : ''}
                ${block.content.showDescription ? '<p style="color: #666666; margin-bottom: 16px;">Product Description</p>' : ''}
                <a href="#" style="display: inline-block; padding: 8px 16px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px;">${block.content.buttonText || 'Buy Now'}</a>
              </div>
            `;
          default:
            return '';
        }
      })
      .join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${template.name}</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          ${blocksHtml}
        </body>
      </html>
    `;
  };

  return { sendEmail };
};
