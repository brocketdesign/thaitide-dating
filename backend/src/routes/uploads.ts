import { Router, Request, Response } from 'express';
import { verifyUploadedPhoto } from '../services/photoVerification';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';

// Supported image formats for OpenAI API
const SUPPORTED_FORMATS = ['png', 'jpeg', 'jpg', 'gif', 'webp'];
const MAX_IMAGE_SIZE = 1024; // Max dimension in pixels
const JPEG_QUALITY = 85; // Compression quality

/**
 * Process and compress image: converts to JPEG and compresses
 * @param base64Data - Base64 encoded image data
 * @returns Processed base64 image string
 */
async function processImage(base64Data: string): Promise<{ processed: string; originalFormat: string }> {
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Get image metadata to detect format
  const metadata = await sharp(buffer).metadata();
  const originalFormat = metadata.format || 'unknown';
  
  // Process image: resize if needed and convert to JPEG for consistency
  let pipeline = sharp(buffer);
  
  // Resize if image is too large (maintains aspect ratio)
  if (metadata.width && metadata.height) {
    if (metadata.width > MAX_IMAGE_SIZE || metadata.height > MAX_IMAGE_SIZE) {
      pipeline = pipeline.resize(MAX_IMAGE_SIZE, MAX_IMAGE_SIZE, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
  }
  
  // Convert to JPEG with compression
  const processedBuffer = await pipeline
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
  
  return {
    processed: processedBuffer.toString('base64'),
    originalFormat
  };
}

const router = Router();

// Store uploads in memory or use a cloud service in production
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Verify photo (base64 input)
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image provided' 
      });
    }

    // Remove data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    
    // Process image: compress and convert to JPEG
    let processedImage: string;
    try {
      const { processed, originalFormat } = await processImage(base64Data);
      processedImage = processed;
      console.log(`Image converted from ${originalFormat} to JPEG and compressed`);
    } catch (imageError) {
      console.error('Image processing error:', imageError);
      return res.status(400).json({
        success: false,
        message: 'Unable to process image. Please ensure your image is a valid PNG, JPEG, GIF, or WebP format.'
      });
    }
    
    // Verify the processed photo
    const verification = await verifyUploadedPhoto(processedImage);
    
    if (!verification.verified) {
      return res.status(400).json({
        success: false,
        message: verification.reason,
        verification
      });
    }

    // Generate unique filename
    const filename = `photo_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
    const filepath = path.join(UPLOAD_DIR, filename);
    
    // Save processed file
    const buffer = Buffer.from(processedImage, 'base64');
    fs.writeFileSync(filepath, buffer);
    
    // In production, upload to cloud storage (S3, Cloudinary, etc.)
    // For now, return local path
    const photoUrl = `/uploads/${filename}`;
    
    res.json({
      success: true,
      message: 'Photo verified and uploaded successfully',
      photoUrl,
      verification
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing upload' 
    });
  }
});

// Quick moderation check without saving
router.post('/moderate', async (req: Request, res: Response) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image provided' 
      });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    
    // Process image: compress and convert to JPEG
    let processedImage: string;
    try {
      const { processed } = await processImage(base64Data);
      processedImage = processed;
    } catch (imageError) {
      console.error('Image processing error:', imageError);
      return res.status(400).json({
        success: false,
        message: 'Unable to process image. Please ensure your image is a valid PNG, JPEG, GIF, or WebP format.'
      });
    }
    
    const verification = await verifyUploadedPhoto(processedImage);
    
    res.json({
      success: verification.verified,
      verification
    });
  } catch (error) {
    console.error('Moderation error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error processing moderation' 
    });
  }
});

export default router;
