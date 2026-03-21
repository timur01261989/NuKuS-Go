import { Router } from "express";
import { authProxyController }          from "../controllers/authProxy.controller";
import { rideProxyController }          from "../controllers/rideProxy.controller";
import { deliveryProxyController }      from "../controllers/deliveryProxy.controller";
import { paymentProxyController }       from "../controllers/paymentProxy.controller";
import { freightProxyController }       from "../controllers/freightProxy.controller";
import { intercityProxyController }     from "../controllers/intercityProxy.controller";
import { interdistrictProxyController } from "../controllers/interdistrictProxy.controller";
import { marketplaceProxyController }   from "../controllers/marketplaceProxy.controller";
import { foodProxyController }          from "../controllers/foodProxy.controller";
import { analyticsProxyController }     from "../controllers/analyticsProxy.controller";
import { searchProxyController }        from "../controllers/searchProxy.controller";
import { mlProxyController }            from "../controllers/mlProxy.controller";
import { rewardProxyController }        from "../controllers/rewardProxy.controller";
import { routingProxy_controller_ts }   from "../controllers/routingProxy.controller";
import { corporateProxy_controller_ts } from "../controllers/corporateProxy.controller";
import { safetyProxy_controller_ts }    from "../controllers/safetyProxy.controller";
import { subscriptionProxy_controller_ts } from "../controllers/subscriptionProxy.controller";
import { verificationProxy_controller_ts } from "../controllers/verificationProxy.controller";
import { promoProxy_controller_ts }     from "../controllers/promoProxy.controller";
import { authMiddleware }               from "../middlewares/auth.middleware";
import { circuitBreakerMiddleware }     from "../middlewares/circuitBreaker.middleware";

const router = Router();

// ── Public endpoints ──────────────────────────────────────────────────────────
router.use("/auth",         authProxyController);
router.use("/search",       searchProxyController);
router.use("/subscription/plans", subscriptionProxy_controller_ts);
router.use("/trip-share",   safetyProxy_controller_ts);   // Public trip sharing

// ── Authenticated endpoints ───────────────────────────────────────────────────
router.use("/ride",         authMiddleware, circuitBreakerMiddleware("ride"),         rideProxyController);
router.use("/delivery",     authMiddleware, circuitBreakerMiddleware("delivery"),     deliveryProxyController);
router.use("/payment",      authMiddleware, circuitBreakerMiddleware("payment"),      paymentProxyController);
router.use("/freight",      authMiddleware, circuitBreakerMiddleware("freight"),      freightProxyController);
router.use("/intercity",    authMiddleware, circuitBreakerMiddleware("intercity"),    intercityProxyController);
router.use("/interdistrict",authMiddleware, circuitBreakerMiddleware("interdistrict"),interdistrictProxyController);
router.use("/marketplace",  authMiddleware, circuitBreakerMiddleware("marketplace"),  marketplaceProxyController);
router.use("/food",         authMiddleware, circuitBreakerMiddleware("food"),         foodProxyController);
router.use("/rewards",      authMiddleware, circuitBreakerMiddleware("reward"),       rewardProxyController);
router.use("/routing",      authMiddleware, circuitBreakerMiddleware("routing"),      routingProxy_controller_ts);
router.use("/corporate",    authMiddleware, circuitBreakerMiddleware("corporate"),    corporateProxy_controller_ts);
router.use("/safety",       authMiddleware, circuitBreakerMiddleware("safety"),       safetyProxy_controller_ts);
router.use("/subscription", authMiddleware, circuitBreakerMiddleware("subscription"), subscriptionProxy_controller_ts);
router.use("/verification", authMiddleware, circuitBreakerMiddleware("verification"), verificationProxy_controller_ts);
router.use("/promo",        authMiddleware, promoProxy_controller_ts);
router.use("/ml",           authMiddleware, mlProxyController);

// ── Internal/Admin endpoints ──────────────────────────────────────────────────
router.use("/analytics",    authMiddleware, analyticsProxyController);

export default router;
// Note: chat, wallet, earnings, ab-testing, privacy proxies
// import { chatProxy } from "../controllers/chatProxy.controller";
// etc. — add when services are deployed
