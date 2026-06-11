import express from "express";
import {
  getPublicSiteConfig,
  getPublicContactInfo,
  getPublicTheme,
  getPublicSeo,
} from "../controllers/admin/siteConfig.controller.js";

const router = express.Router();

router.get("/site-config", getPublicSiteConfig);
router.get("/contact-info", getPublicContactInfo);
router.get("/theme", getPublicTheme);
router.get("/seo", getPublicSeo);

export default router;
