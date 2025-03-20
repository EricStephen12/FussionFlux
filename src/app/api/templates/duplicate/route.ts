import { NextResponse } from 'next/server';
import { db } from '@/utils/firebase-admin';
import { verifyAuth } from '@/utils/auth-server';

export async function POST(request: Request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    const session = await verifyAuth(token);
    
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { templateId } = await request.json();
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    // Get template to duplicate
    const templateRef = db.collection('templates').doc(templateId);
    const templateDoc = await templateRef.get();
    
    if (!templateDoc.exists) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    const templateData = templateDoc.data();
    
    // Create a duplicate template
    const duplicateData = {
      ...templateData,
      name: `${templateData?.name} (Copy)`,
      userId: session.sub,
      lastModified: new Date().toISOString()
    };
    
    // Remove the id field if it exists
    delete duplicateData.id;
    
    // Add the duplicate template to Firestore
    const newTemplateRef = await db.collection('templates').add(duplicateData);
    
    return NextResponse.json({ 
      success: true,
      id: newTemplateRef.id,
      template: {
        id: newTemplateRef.id,
        ...duplicateData
      }
    });
  } catch (error: any) {
    console.error('Error duplicating template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to duplicate template' },
      { status: 500 }
    );
  }
} 