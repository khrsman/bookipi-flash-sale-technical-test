const { validateCreateFlashSale, validateUserIdentifier } = require('../middleware/validation');

describe('Validation Middleware Tests', () => {
  
  describe('validateCreateFlashSale', () => {
    
    let req, res, next;

    beforeEach(() => {
      req = {
        body: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('should pass validation with valid data', () => {
      req.body = {
        productName: 'Valid Product',
        totalStock: 100,
        startTime: new Date(Date.now() + 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
      };

      validateCreateFlashSale(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail when productName is missing', () => {
      req.body = {
        totalStock: 100,
        startTime: new Date(Date.now() + 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
      };

      validateCreateFlashSale(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('productName'),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail when totalStock is missing', () => {
      req.body = {
        productName: 'Test',
        startTime: new Date(Date.now() + 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
      };

      validateCreateFlashSale(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('totalStock'),
        })
      );
    });

    it('should fail when startTime is missing', () => {
      req.body = {
        productName: 'Test',
        totalStock: 100,
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
      };

      validateCreateFlashSale(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('startTime'),
        })
      );
    });

    it('should fail when endTime is missing', () => {
      req.body = {
        productName: 'Test',
        totalStock: 100,
        startTime: new Date(Date.now() + 1000 * 60 * 60),
      };

      validateCreateFlashSale(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('endTime'),
        })
      );
    });

    it('should fail when totalStock is negative', () => {
      req.body = {
        productName: 'Test',
        totalStock: -10,
        startTime: new Date(Date.now() + 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
      };

      validateCreateFlashSale(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('positive number'),
        })
      );
    });

    it('should fail with invalid stock (zero)', () => {
      req.body = {
        productName: 'Test',
        totalStock: 0,
        startTime: new Date(Date.now() + 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
      };

      validateCreateFlashSale(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
      // Zero is treated as falsy in validation, so it's caught as missing field
    });

    it('should fail when startTime is after endTime', () => {
      req.body = {
        productName: 'Test',
        totalStock: 100,
        startTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
        endTime: new Date(Date.now() + 1000 * 60 * 60),
      };

      validateCreateFlashSale(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('Start time must be before end time'),
        })
      );
    });

    it('should fail when startTime equals endTime', () => {
      const sameTime = new Date(Date.now() + 1000 * 60 * 60);
      req.body = {
        productName: 'Test',
        totalStock: 100,
        startTime: sameTime,
        endTime: sameTime,
      };

      validateCreateFlashSale(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should fail when totalStock is not a number', () => {
      req.body = {
        productName: 'Test',
        totalStock: '100',
        startTime: new Date(Date.now() + 1000 * 60 * 60),
        endTime: new Date(Date.now() + 1000 * 60 * 60 * 24),
      };

      validateCreateFlashSale(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validateUserIdentifier', () => {
    
    let req, res, next;

    beforeEach(() => {
      req = {
        body: {}
      };
      res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      next = jest.fn();
    });

    it('should pass with valid user identifier', () => {
      req.body = {
        userIdentifier: 'user123@email.com'
      };

      validateUserIdentifier(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should fail when userIdentifier is missing', () => {
      req.body = {};

      validateUserIdentifier(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('User identifier is required'),
        })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail when userIdentifier is empty string', () => {
      req.body = {
        userIdentifier: ''
      };

      validateUserIdentifier(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should pass with numeric user identifier', () => {
      req.body = {
        userIdentifier: '12345'
      };

      validateUserIdentifier(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should pass with email containing allowed special characters', () => {
      req.body = {
        userIdentifier: 'user@example.com'
      };

      validateUserIdentifier(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should fail when userIdentifier is too short', () => {
      req.body = {
        userIdentifier: 'ab'
      };

      validateUserIdentifier(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('at least 3 characters'),
        })
      );
    });

    it('should fail with invalid format (special characters)', () => {
      req.body = {
        userIdentifier: 'user+test#invalid'
      };

      validateUserIdentifier(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
