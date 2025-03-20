import { firestoreService } from './firestore';
import { db } from '@/utils/firebase';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

// Template related types
export interface BlockData {
  type: string;
  content: Record<string, any>;
  id: string;
  [key: string]: any;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'draft' | 'published';
  blocks: BlockData[];
  lastModified: string;
  thumbnail?: string;
  userId?: string;
  isPreset?: boolean;
}

export interface TemplateServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errorCode?: string;
}

const TEMPLATE_CACHE_KEY = 'template_cache';
const CACHE_EXPIRY = 1000 * 60 * 5; // 5 minutes

class TemplateService {
  private templatesRef = collection(db, 'templates');
  private cacheInitialized = false;
  private templateCache: Map<string, { template: Template, timestamp: number }> = new Map();

  constructor() {
    this.initializeCache();
  }

  private initializeCache(): void {
    if (typeof window !== 'undefined') {
      try {
        const cachedData = localStorage.getItem(TEMPLATE_CACHE_KEY);
        if (cachedData) {
          const { templates, timestamp } = JSON.parse(cachedData);
          
          // Check if cache is still valid
          if (Date.now() - timestamp < CACHE_EXPIRY) {
            templates.forEach((t: { id: string, template: Template, timestamp: number }) => {
              this.templateCache.set(t.id, { template: t.template, timestamp: t.timestamp });
            });
          } else {
            // Clear expired cache
            localStorage.removeItem(TEMPLATE_CACHE_KEY);
          }
        }
      } catch (error) {
        console.warn('Failed to initialize template cache:', error);
        // Clear potentially corrupted cache
        localStorage.removeItem(TEMPLATE_CACHE_KEY);
      }
      this.cacheInitialized = true;
    }
  }

  private saveCache(): void {
    if (typeof window !== 'undefined' && this.cacheInitialized) {
      try {
        const templates = Array.from(this.templateCache.entries()).map(([id, data]) => ({
          id,
          template: data.template,
          timestamp: data.timestamp
        }));
        
        localStorage.setItem(TEMPLATE_CACHE_KEY, JSON.stringify({
          templates,
          timestamp: Date.now()
        }));
      } catch (error) {
        console.warn('Failed to save template cache:', error);
      }
    }
  }

  async get(templateId: string): Promise<TemplateServiceResult<Template>> {
    try {
      // Check cache first
      const cachedTemplate = this.templateCache.get(templateId);
      if (cachedTemplate && Date.now() - cachedTemplate.timestamp < CACHE_EXPIRY) {
        return {
          success: true,
          data: cachedTemplate.template
        };
      }
      
      // Actual Firestore fetch logic
      const templateRef = doc(this.templatesRef, templateId);
      const templateDoc = await getDoc(templateRef);

      if (!templateDoc.exists()) {
        return {
          success: false,
          error: `Template with ID ${templateId} not found`,
          errorCode: 'template-not-found'
        };
      }

      const template = {
        id: templateDoc.id,
        ...templateDoc.data()
      } as Template;

      // Add to cache
      this.templateCache.set(templateId, {
        template,
        timestamp: Date.now()
      });
      this.saveCache();

      return {
        success: true,
        data: template
      };
    } catch (error: any) {
      console.error('Error fetching template:', error);
      return {
        success: false,
        error: `Failed to fetch template: ${error.message}`,
        errorCode: 'template-fetch-error'
      };
    }
  }

  async getAll(userId?: string): Promise<TemplateServiceResult<Template[]>> {
    try {
      let q;
      
      if (userId) {
        // Get user-created templates
        q = query(this.templatesRef, where('userId', '==', userId));
      } else {
        // Get all templates
        q = this.templatesRef;
      }
      
      const querySnapshot = await getDocs(q);
      
      const templates: Template[] = [];
      querySnapshot.forEach((doc) => {
        templates.push({
          id: doc.id,
          ...doc.data()
        } as Template);
        
        // Add to cache
        this.templateCache.set(doc.id, {
          template: {
            id: doc.id,
            ...doc.data()
          } as Template,
          timestamp: Date.now()
        });
      });
      
      this.saveCache();
      
      return {
        success: true,
        data: templates
      };
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      return {
        success: false,
        error: `Failed to fetch templates: ${error.message}`,
        errorCode: 'templates-fetch-error'
      };
    }
  }

  async create(template: Omit<Template, 'id'>): Promise<TemplateServiceResult<Template>> {
    try {
      const templateWithTimestamp = {
        ...template,
        lastModified: new Date().toISOString()
      };
      
      const docRef = await addDoc(this.templatesRef, templateWithTimestamp);
      
      const newTemplate = {
        id: docRef.id,
        ...templateWithTimestamp
      } as Template;
      
      // Add to cache
      this.templateCache.set(docRef.id, {
        template: newTemplate,
        timestamp: Date.now()
      });
      this.saveCache();
      
      return {
        success: true,
        data: newTemplate
      };
    } catch (error: any) {
      console.error('Error creating template:', error);
      return {
        success: false,
        error: `Failed to create template: ${error.message}`,
        errorCode: 'template-create-error'
      };
    }
  }

  async update(templateId: string, updates: Partial<Template>): Promise<TemplateServiceResult<Template>> {
    try {
      const templateRef = doc(this.templatesRef, templateId);
      
      // Add last modified timestamp
      const updatesWithTimestamp = {
        ...updates,
        lastModified: new Date().toISOString()
      };
      
      await updateDoc(templateRef, updatesWithTimestamp);
      
      // Get the updated template
      const updatedTemplateResult = await this.get(templateId);
      
      if (!updatedTemplateResult.success) {
        return updatedTemplateResult;
      }
      
      return {
        success: true,
        data: updatedTemplateResult.data!
      };
    } catch (error: any) {
      console.error('Error updating template:', error);
      return {
        success: false,
        error: `Failed to update template: ${error.message}`,
        errorCode: 'template-update-error'
      };
    }
  }

  async delete(templateId: string): Promise<TemplateServiceResult<void>> {
    try {
      const templateRef = doc(this.templatesRef, templateId);
      await deleteDoc(templateRef);
      
      // Remove from cache
      this.templateCache.delete(templateId);
      this.saveCache();
      
      return {
        success: true
      };
    } catch (error: any) {
      console.error('Error deleting template:', error);
      return {
        success: false,
        error: `Failed to delete template: ${error.message}`,
        errorCode: 'template-delete-error'
      };
    }
  }

  async duplicate(templateId: string, userId: string): Promise<TemplateServiceResult<Template>> {
    try {
      // Get original template
      const originalTemplateResult = await this.get(templateId);
      
      if (!originalTemplateResult.success) {
        return originalTemplateResult;
      }
      
      const originalTemplate = originalTemplateResult.data!;
      
      // Create a new template based on the original
      const duplicatedTemplate: Omit<Template, 'id'> = {
        name: `Copy of ${originalTemplate.name}`,
        category: originalTemplate.category,
        description: originalTemplate.description,
        status: 'draft',
        blocks: originalTemplate.blocks,
        lastModified: new Date().toISOString(),
        thumbnail: originalTemplate.thumbnail,
        userId,
        isPreset: false
      };
      
      // Save the duplicated template
      return await this.create(duplicatedTemplate);
    } catch (error: any) {
      console.error('Error duplicating template:', error);
      return {
        success: false,
        error: `Failed to duplicate template: ${error.message}`,
        errorCode: 'template-duplicate-error'
      };
    }
  }

  // Get default fallback template when everything else fails
  getFallbackTemplate(templateId: string): Template {
    return {
      id: templateId || 'fallback-template',
      name: 'Fallback Template',
      category: 'General',
      description: 'A fallback template when the regular template service is unavailable',
      status: 'draft',
      blocks: [
        {
          id: 'fallback-block-1',
          type: 'text',
          content: {
            text: 'This is a fallback template. The original template could not be loaded.',
            fontSize: '16px',
            color: '#333333',
            alignment: 'left'
          }
        }
      ],
      lastModified: new Date().toISOString()
    };
  }

  /**
   * Clear the template cache
   */
  clearCache(): void {
    this.templateCache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TEMPLATE_CACHE_KEY);
    }
  }
}

export const templateService = new TemplateService(); 