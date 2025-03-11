# Data Sources Implementation Guide

## 1. Contact Database Sources

### Option A: Data Partnerships
- Partner with data providers like ZoomInfo, Clearbit, or Hunter.io
- Implementation example:

```typescript
class ContactService {
  private readonly zoomInfo = new ZoomInfoAPI(process.env.ZOOMINFO_API_KEY);
  private readonly clearbit = new ClearbitAPI(process.env.CLEARBIT_API_KEY);
  
  async searchContacts(params: SearchParams): Promise<Contact[]> {
    // Search across multiple data sources
    const [zoomInfoResults, clearbitResults] = await Promise.all([
      this.zoomInfo.searchCompanies(params),
      this.clearbit.searchCompanies(params)
    ]);
    
    return this.mergeAndEnrichResults(zoomInfoResults, clearbitResults);
  }
}
```

### Option B: Web Scraping + Enrichment
- Scrape public business data from LinkedIn, company websites
- Enrich with email finding tools
- Implementation example:

```typescript
class ScrapingService {
  private readonly emailFinder = new EmailFinderAPI(process.env.EMAIL_FINDER_KEY);
  
  async scrapeAndEnrich(company: string): Promise<Contact[]> {
    const employees = await this.scrapeCompanyEmployees(company);
    const enriched = await Promise.all(
      employees.map(emp => this.emailFinder.find(emp.name, company))
    );
    return enriched;
  }
}
```

## 2. Email Templates Source

### Industry-Specific Templates
- Create templates based on industry research
- Use AI to generate variations
- Track performance metrics

```typescript
class TemplateService {
  async getTemplatesForIndustry(industry: string): Promise<Template[]> {
    // Get base templates
    const baseTemplates = await this.loadIndustryTemplates(industry);
    
    // Get performance data
    const performance = await this.getTemplatePerformance();
    
    // Generate variations using AI
    const variations = await this.generateVariations(baseTemplates);
    
    return this.rankAndFilterTemplates(
      [...baseTemplates, ...variations],
      performance
    );
  }
}
```

## 3. Analytics Implementation

### Tracking System
- Use pixel tracking for emails
- UTM parameters for links
- Webhook system for conversions

```typescript
class AnalyticsService {
  async trackEmailOpen(campaignId: string, contactId: string): Promise<void> {
    await this.recordEvent({
      type: 'email_open',
      campaignId,
      contactId,
      timestamp: new Date()
    });
  }
  
  async trackConversion(campaignId: string, data: ConversionData): Promise<void> {
    await this.recordEvent({
      type: 'conversion',
      campaignId,
      revenue: data.revenue,
      product: data.product,
      timestamp: new Date()
    });
  }
}
```

## 4. Integration Examples

### Shopify Integration
```typescript
class ShopifyIntegration {
  async syncCustomers(): Promise<void> {
    const shopifyCustomers = await this.shopify.getCustomers();
    await this.importToContacts(shopifyCustomers);
  }
  
  async trackOrders(): Promise<void> {
    this.shopify.webhook.on('order/created', async (order) => {
      await this.analyticsService.trackConversion({
        campaignId: order.utm_campaign,
        revenue: order.total_price,
        product: order.line_items
      });
    });
  }
}
```

### CRM Integration
```typescript
class CRMIntegration {
  async syncContacts(crmType: 'hubspot' | 'salesforce'): Promise<void> {
    const crmService = this.getCRMService(crmType);
    const contacts = await crmService.getContacts();
    
    await this.contactService.bulkImport(contacts);
  }
}
```

## 5. Credit System Implementation

```typescript
class CreditSystem {
  async deductCredits(userId: string, action: CreditAction): Promise<void> {
    const costs = {
      contact_search: 1,
      contact_enrich: 5,
      email_send: 1,
      sms_send: 5
    };
    
    await this.db.runTransaction(async (tx) => {
      const userCredits = await this.getUserCredits(userId, tx);
      if (userCredits < costs[action]) {
        throw new Error('Insufficient credits');
      }
      
      await this.updateCredits(
        userId,
        userCredits - costs[action],
        tx
      );
    });
  }
}
``` 