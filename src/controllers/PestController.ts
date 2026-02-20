import type { Request, Response } from 'express';
import { auditLog } from '@/middleware/auditMiddleware';
import PestModel from '@/models/PestModel';

class PestController {
  // Create new pest record
  static async addPest(req: Request, res: Response): Promise<Response> {
    try {
      console.log('Request body:', req.body);

      const { pestName, recommendations, activeMonth, season } = req.body;

      // Validate required fields
      if (!pestName || !recommendations || !activeMonth || !season) {
        console.log('❌ Validation failed - missing required fields');
        return res.status(400).json({
          success: false,
          message: 'Pest name, recommendations, active month, and season are required',
          received: req.body,
        });
      }

      const pestData = {
        pestName,
        recommendations: Array.isArray(recommendations) ? recommendations : [recommendations],
        activeMonth: Array.isArray(activeMonth) ? activeMonth : [activeMonth],
        season,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      console.log('✅ Pest data to save:', pestData);

      const result = await PestModel.create(pestData);
      console.log('✅ Database result:', result);

      // Log the audit
      await auditLog.create('pest', result.insertedId.toString(), pestData, req);

      return res.status(201).json({
        success: true,
        message: 'Pest record created successfully',
        data: { _id: result.insertedId, ...pestData },
      });
    } catch (error) {
      console.error('❌ Error creating pest record:', error);

      // Log the failure
      await auditLog.failure('CREATE', 'pest', undefined, error as Error, req);

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: (error as Error).message,
      });
    }
  }

  // Get all pest records
  static async getAllPests(_req: Request, res: Response): Promise<Response> {
    try {
      const pests = await PestModel.findAll();
      console.log('✅ Found pests:', pests.length);

      return res.status(200).json({
        success: true,
        message: 'Pest records retrieved successfully',
        data: pests,
        count: pests.length,
      });
    } catch (error) {
      console.error('❌ Error fetching pest records:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: (error as Error).message,
      });
    }
  }

  // Get pest record by ID
  static async getPestById(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      console.log('Pest ID:', id);

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Pest ID is required',
        });
      }

      const pest = await PestModel.findById(id);
      console.log('✅ Found pest:', pest);

      if (!pest) {
        return res.status(404).json({
          success: false,
          message: 'Pest record not found',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Pest record retrieved successfully',
        data: pest,
      });
    } catch (error) {
      console.error('❌ Error fetching pest record:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: (error as Error).message,
      });
    }
  }

  // Update pest record by ID
  static async updatePest(req: Request, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      console.log('Pest ID:', id);
      console.log('Request body:', req.body);

      if (!id) {
        return res.status(400).json({
          success: false,
          message: 'Pest ID is required',
        });
      }

      const { pestName, recommendations, activeMonth, season } = req.body;

      // Get the old data first for audit logging
      const oldPest = await PestModel.findById(id);
      if (!oldPest) {
        return res.status(404).json({
          success: false,
          message: 'Pest record not found',
        });
      }

      // Validate required fields
      if (!pestName || !recommendations || !activeMonth || !season) {
        console.log('❌ Validation failed - missing required fields');
        return res.status(400).json({
          success: false,
          message: 'Pest name, recommendations, active month, and season are required',
          received: req.body,
        });
      }

      const updateData = {
        pestName,
        recommendations: Array.isArray(recommendations) ? recommendations : [recommendations],
        activeMonth: Array.isArray(activeMonth) ? activeMonth : [activeMonth],
        season,
        updatedAt: new Date(),
      };

      console.log('✅ Update data:', updateData);

      const result = await PestModel.updateById(id, updateData);
      console.log('✅ Database result:', result);

      if (result.matchedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Pest record not found',
        });
      }

      // Log the audit
      await auditLog.update('pest', id, oldPest, updateData, req);

      return res.status(200).json({
        success: true,
        message: 'Pest record updated successfully',
        data: { _id: id, ...updateData },
      });
    } catch (error) {
      console.error('❌ Error updating pest record:', error);

      // Log the failure
      await auditLog.failure('UPDATE', 'pest', req.params.id, error as Error, req);

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: (error as Error).message,
      });
    }
  }
}

export default PestController;
