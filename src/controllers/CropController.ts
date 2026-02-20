import type { Request, Response } from 'express';
import { auditLog } from '@/middleware/auditMiddleware';
import CropsModel from '@/models/CropsModel';

class CropController {
  // Get all crops
  static async getAllCrops(_req: Request, res: Response): Promise<Response> {
    try {
      const crops = await CropsModel.findAll();

      return res.status(200).json({
        success: true,
        message: 'Crops retrieved successfully',
        data: crops,
        count: crops.length,
      });
    } catch (error) {
      console.error('Error fetching crops:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: (error as Error).message,
      });
    }
  }

  // Get crop by ID
  static async getCropById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const crop = await CropsModel.findById(id);

      if (!crop) {
        return res.status(404).json({
          success: false,
          message: 'Crop not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Crop retrieved successfully',
        data: crop,
      });
    } catch (error) {
      console.error('Error fetching crop by ID:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: (error as Error).message,
      });
    }
  }

  // Get crop by cropId
  static async getCropByCropId(req: Request, res: Response): Promise<Response> {
    try {
      const { cropId } = req.params;
      const crop = await CropsModel.findByCropId(cropId);

      if (!crop) {
        return res.status(404).json({
          success: false,
          message: 'Crop not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Crop retrieved successfully',
        data: crop,
      });
    } catch (error) {
      console.error('Error fetching crop by cropId:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: (error as Error).message,
      });
    }
  }

  // Create new crop
  static async createCrop(req: Request, res: Response): Promise<Response> {
    try {
      const { cropId, cropName, cropType, season } = req.body;

      // Validate required fields
      if (!cropId || !cropName) {
        return res.status(400).json({
          success: false,
          message: 'Crop ID and crop name are required',
        });
      }

      // Check if cropId already exists
      const existingCrop = await CropsModel.findByCropId(cropId);
      if (existingCrop) {
        return res.status(409).json({
          success: false,
          message: 'Crop with this ID already exists',
        });
      }

      const cropData = {
        cropId,
        cropName,
        cropType: cropType || '',
        season: season || '',
      };

      const result = await CropsModel.create(cropData);

      // Log the audit
      await auditLog.create('crop', result.insertedId.toString(), cropData, req);

      return res.status(201).json({
        success: true,
        message: 'Crop created successfully',
        data: { _id: result.insertedId, ...cropData },
      });
    } catch (error) {
      console.error('Error creating crop:', error);

      // Log the failure
      await auditLog.failure('CREATE', 'crop', undefined, error as Error, req);

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: (error as Error).message,
      });
    }
  }

  // Update crop
  static async updateCrop(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const { cropName, cropType, season } = req.body;

      const existingCrop = await CropsModel.findById(id);
      if (!existingCrop) {
        return res.status(404).json({
          success: false,
          message: 'Crop not found',
        });
      }

      const updateData: Record<string, string> = {};
      if (cropName) updateData.cropName = cropName;
      if (cropType) updateData.cropType = cropType;
      if (season) updateData.season = season;

      const result = await CropsModel.update(id, updateData);

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Crop not found',
        });
      }

      // Log the audit
      await auditLog.update('crop', id, existingCrop, updateData, req);

      return res.status(200).json({
        success: true,
        message: 'Crop updated successfully',
      });
    } catch (error) {
      console.error('Error updating crop:', error);

      // Log the failure
      await auditLog.failure('UPDATE', 'crop', req.params.id, error as Error, req);

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: (error as Error).message,
      });
    }
  }

  // Delete crop
  static async deleteCrop(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;

      // Get the crop data before deletion for audit logging
      const cropToDelete = await CropsModel.findById(id);
      if (!cropToDelete) {
        return res.status(404).json({
          success: false,
          message: 'Crop not found',
        });
      }

      const result = await CropsModel.delete(id);

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Crop not found',
        });
      }

      // Log the audit
      await auditLog.delete('crop', id, cropToDelete, req);

      return res.status(200).json({
        success: true,
        message: 'Crop deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting crop:', error);

      // Log the failure
      await auditLog.failure('DELETE', 'crop', req.params.id, error as Error, req);

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: (error as Error).message,
      });
    }
  }

  // Search crops
  static async searchCrops(req: Request, res: Response): Promise<Response> {
    try {
      const { q } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          message: 'Search query is required',
        });
      }

      const crops = await CropsModel.search(q as string);

      return res.status(200).json({
        success: true,
        message: 'Crops search completed',
        data: crops,
        count: crops.length,
      });
    } catch (error) {
      console.error('Error searching crops:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: (error as Error).message,
      });
    }
  }
}

export default CropController;
