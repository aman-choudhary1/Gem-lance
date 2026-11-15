import { Router } from 'express';
import { alertController } from '../controllers/alertController';
import { authenticateJwt } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createAlertSchema, updateAlertSchema } from '../validators/alertSchemas';

const router = Router();

router.use(authenticateJwt);

router.get('/', alertController.getAlerts);
router.post('/', validate(createAlertSchema), alertController.createAlert);
router.patch('/:id', validate(updateAlertSchema), alertController.updateAlert);
router.delete('/:id', alertController.deleteAlert);

export default router;
