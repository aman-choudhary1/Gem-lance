import { Router } from 'express';
import { locationController } from '../controllers/locationController';

const router = Router();

router.get('/states', locationController.getStates);
router.get('/districts', locationController.getDistricts);

export default router;
