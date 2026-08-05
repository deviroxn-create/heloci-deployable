/**
 * COMMUNICATION REQUEST CONTRACT TESTS
 * ===================================
 * Certification tests proving contract immutability and validity.
 * K1.C0 — Communication Contract Certification
 */

import {
  CommunicationRequestBuilder,
  CommunicationRequestValidator,
  CommunicationRequestFactory,
  RecipientFactory,
  ChannelPlanFactory,
  RenderedTemplateFactory,
} from "../index";
import { v4 as uuidv4 } from "uuid";

describe("K1.C0 — Communication Contract Certification", () => {
  // ========== BUILDER TESTS ==========

  describe("CommunicationRequestBuilder", () => {
    describe("Partial builds", () => {
      it("should reject build with missing traceId", () => {
        const builder = new CommunicationRequestBuilder()
          .withOrganizationId("org123")
          .withEvent("test.event")
          .withEventPayload({});

        const result = builder.build();

        expect(result.success).toBe(false);
        expect(result.errors).toContain("traceId is required");
      });

      it("should reject build with missing organizationId", () => {
        const builder = new CommunicationRequestBuilder()
          .withTraceId(uuidv4())
          .withEvent("test.event")
          .withEventPayload({});

        const result = builder.build();

        expect(result.success).toBe(false);
        expect(result.errors).toContain("organizationId is required");
      });

      it("should reject build with empty audiences", () => {
        const builder = new CommunicationRequestBuilder()
          .withTraceId(uuidv4())
          .withOrganizationId("org123")
          .withEvent("test.event")
          .withEventPayload({});

        const result = builder.build();

        expect(result.success).toBe(false);
        expect(result.errors.some((e) => e.includes("audience")));
      });

      it("should reject build with no recipients", () => {
        const builder = new CommunicationRequestBuilder()
          .withTraceId(uuidv4())
          .withOrganizationId("org123")
          .withEvent("test.event")
          .withEventPayload({})
          .withAudiences(["applicant"]);

        const result = builder.build();

        expect(result.success).toBe(false);
        expect(result.errors.some((e) => e.includes("recipient")));
      });

      it("should reject build with empty channelPlan", () => {
        const recipient = RecipientFactory.create({
          id: "user123",
          email: "test@example.com",
          role: "applicant",
          organizationId: "org123",
        });

        const builder = new CommunicationRequestBuilder()
          .withTraceId(uuidv4())
          .withOrganizationId("org123")
          .withEvent("test.event")
          .withEventPayload({})
          .withAudiences(["applicant"])
          .withRecipients([recipient])
          .withChannels(["email"]);

        const result = builder.build();

        expect(result.success).toBe(false);
        expect(result.errors.some((e) => e.includes("channelPlan")));
      });

      it("should reject build with missing template", () => {
        const recipient = RecipientFactory.create({
          id: "user123",
          email: "test@example.com",
          role: "applicant",
          organizationId: "org123",
        });

        const plan = ChannelPlanFactory.create({
          recipientId: "user123",
          primary: "email",
          fallbacks: ["internal"],
        });

        const builder = new CommunicationRequestBuilder()
          .withTraceId(uuidv4())
          .withOrganizationId("org123")
          .withEvent("test.event")
          .withEventPayload({})
          .withAudiences(["applicant"])
          .withRecipients([recipient])
          .withChannels(["email"])
          .withChannelPlan([plan]);

        const result = builder.build();

        expect(result.success).toBe(false);
        expect(result.errors.some((e) => e.includes("template")));
      });

      it("should reject build with missing rendered content", () => {
        const recipient = RecipientFactory.create({
          id: "user123",
          email: "test@example.com",
          role: "applicant",
          organizationId: "org123",
        });

        const plan = ChannelPlanFactory.create({
          recipientId: "user123",
          primary: "email",
          fallbacks: ["internal"],
        });

        const template = {
          id: "tmpl123",
          name: "welcome",
          version: "1.0.0",
          language: "en",
          channel: "email" as const,
          variables: ["name"],
          status: "PUBLISHED" as const,
        };

        const builder = new CommunicationRequestBuilder()
          .withTraceId(uuidv4())
          .withOrganizationId("org123")
          .withEvent("test.event")
          .withEventPayload({})
          .withAudiences(["applicant"])
          .withRecipients([recipient])
          .withChannels(["email"])
          .withChannelPlan([plan])
          .withTemplate(template);

        const result = builder.build();

        expect(result.success).toBe(false);
        expect(result.errors.some((e) => e.includes("rendered")));
      });
    });

    describe("Valid builds", () => {
      it("should create valid request with all required fields", () => {
        const traceId = uuidv4();
        const recipient = RecipientFactory.create({
          id: "user123",
          email: "test@example.com",
          role: "applicant",
          organizationId: "org123",
        });

        const plan = ChannelPlanFactory.create({
          recipientId: "user123",
          primary: "email",
        });

        const template = {
          id: "tmpl123",
          name: "welcome",
          version: "1.0.0",
          language: "en",
          channel: "email" as const,
          variables: ["name"],
          status: "PUBLISHED" as const,
        };

        const rendered = RenderedTemplateFactory.create({
          templateId: "tmpl123",
          subject: "Welcome!",
          body: "Hello user",
          channel: "email",
        });

        const builder = new CommunicationRequestBuilder()
          .withTraceId(traceId)
          .withOrganizationId("org123")
          .withEvent("user.registration")
          .withEventPayload({ userId: "user123" })
          .withAudiences(["applicant"])
          .withRecipients([recipient])
          .withChannels(["email"])
          .withChannelPlan([plan])
          .withTemplate(template)
          .withRendered(rendered);

        const result = builder.build();

        expect(result.success).toBe(true);
        expect(result.request).toBeDefined();
        expect(result.request?.traceId).toBe(traceId);
        expect(result.request?.event).toBe("user.registration");
      });
    });
  });

  // ========== IMMUTABILITY TESTS ==========

  describe("CommunicationRequest Immutability", () => {
    const createValidRequest = () => {
      const traceId = uuidv4();
      const recipient = RecipientFactory.create({
        id: "user123",
        email: "test@example.com",
        role: "applicant",
        organizationId: "org123",
      });

      const plan = ChannelPlanFactory.create({
        recipientId: "user123",
        primary: "email",
      });

      const template = {
        id: "tmpl123",
        name: "welcome",
        version: "1.0.0",
        language: "en",
        channel: "email" as const,
        variables: ["name"],
        status: "PUBLISHED" as const,
      };

      const rendered = RenderedTemplateFactory.create({
        templateId: "tmpl123",
        subject: "Welcome!",
        body: "Hello user",
        channel: "email",
      });

      const builder = new CommunicationRequestBuilder()
        .withTraceId(traceId)
        .withOrganizationId("org123")
        .withEvent("user.registration")
        .withEventPayload({ userId: "user123" })
        .withAudiences(["applicant"])
        .withRecipients([recipient])
        .withChannels(["email"])
        .withChannelPlan([plan])
        .withTemplate(template)
        .withRendered(rendered);

      const result = builder.build();
      if (!result.success || !result.request) {
        throw new Error("Failed to create valid request");
      }
      return result.request;
    };

    it("should be frozen and reject modifications", () => {
      const request = createValidRequest();

      expect(() => {
        (request as any).traceId = "modified";
      }).toThrow();
    });

    it("should have frozen nested objects", () => {
      const request = createValidRequest();

      expect(() => {
        (request.eventPayload as any).newProp = "value";
      }).toThrow();
    });

    it("should have frozen recipients array", () => {
      const request = createValidRequest();

      expect(() => {
        (request.recipients as any).push({});
      }).toThrow();
    });
  });

  // ========== VALIDATOR TESTS ==========

  describe("CommunicationRequestValidator", () => {
    const createValidRequest = () => {
      const traceId = uuidv4();
      const recipient = RecipientFactory.create({
        id: "user123",
        email: "test@example.com",
        role: "applicant",
        organizationId: "org123",
      });

      const plan = ChannelPlanFactory.create({
        recipientId: "user123",
        primary: "email",
      });

      const template = {
        id: "tmpl123",
        name: "welcome",
        version: "1.0.0",
        language: "en",
        channel: "email" as const,
        variables: ["name"],
        status: "PUBLISHED" as const,
      };

      const rendered = RenderedTemplateFactory.create({
        templateId: "tmpl123",
        subject: "Welcome!",
        body: "Hello user",
        channel: "email",
      });

      const builder = new CommunicationRequestBuilder()
        .withTraceId(traceId)
        .withOrganizationId("org123")
        .withEvent("user.registration")
        .withEventPayload({ userId: "user123" })
        .withAudiences(["applicant"])
        .withRecipients([recipient])
        .withChannels(["email"])
        .withChannelPlan([plan])
        .withTemplate(template)
        .withRendered(rendered);

      const result = builder.build();
      if (!result.success || !result.request) {
        throw new Error("Failed to create valid request");
      }
      return result.request;
    };

    it("should validate valid request", () => {
      const request = createValidRequest();
      const validation = CommunicationRequestValidator.validate(request);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should reject null request", () => {
      const validation = CommunicationRequestValidator.validate(null);

      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain("CommunicationRequest is required");
    });

    it("should validate for logging", () => {
      const request = createValidRequest();
      const validation = CommunicationRequestValidator.validateForLogging(request);

      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });

  // ========== FACTORY TESTS ==========

  describe("CommunicationRequestFactory", () => {
    it("should create request from builder function", () => {
      const traceId = uuidv4();
      const recipient = RecipientFactory.create({
        id: "user123",
        email: "test@example.com",
        role: "applicant",
        organizationId: "org123",
      });

      const plan = ChannelPlanFactory.create({
        recipientId: "user123",
        primary: "email",
      });

      const template = {
        id: "tmpl123",
        name: "welcome",
        version: "1.0.0",
        language: "en",
        channel: "email" as const,
        variables: ["name"],
        status: "PUBLISHED" as const,
      };

      const rendered = RenderedTemplateFactory.create({
        templateId: "tmpl123",
        subject: "Welcome!",
        body: "Hello user",
        channel: "email",
      });

      const request = CommunicationRequestFactory.createFromBuilder((builder) => {
        builder
          .withTraceId(traceId)
          .withOrganizationId("org123")
          .withEvent("user.registration")
          .withEventPayload({ userId: "user123" })
          .withAudiences(["applicant"])
          .withRecipients([recipient])
          .withChannels(["email"])
          .withChannelPlan([plan])
          .withTemplate(template)
          .withRendered(rendered);
      });

      expect(request).toBeDefined();
      expect(request.traceId).toBe(traceId);
    });

    it("should throw on invalid enrichment", () => {
      const traceId = uuidv4();
      const recipient = RecipientFactory.create({
        id: "user123",
        email: "test@example.com",
        role: "applicant",
        organizationId: "org123",
      });

      const plan = ChannelPlanFactory.create({
        recipientId: "user123",
        primary: "email",
      });

      const template = {
        id: "tmpl123",
        name: "welcome",
        version: "1.0.0",
        language: "en",
        channel: "email" as const,
        variables: ["name"],
        status: "PUBLISHED" as const,
      };

      const rendered = RenderedTemplateFactory.create({
        templateId: "tmpl123",
        subject: "Welcome!",
        body: "Hello user",
        channel: "email",
      });

      const request = CommunicationRequestFactory.createFromBuilder((builder) => {
        builder
          .withTraceId(traceId)
          .withOrganizationId("org123")
          .withEvent("user.registration")
          .withEventPayload({ userId: "user123" })
          .withAudiences(["applicant"])
          .withRecipients([recipient])
          .withChannels(["email"])
          .withChannelPlan([plan])
          .withTemplate(template)
          .withRendered(rendered);
      });

      // Try to enrich with invalid recipients
      expect(() => {
        CommunicationRequestFactory.enrich(request, {
          recipients: [], // Invalid - must have at least one
        });
      }).toThrow();
    });
  });

  // ========== CONTRACT CERTIFICATION ==========

  describe("Contract Certification", () => {
    it("CERT-001: Contract cannot be partially built", () => {
      const builder = new CommunicationRequestBuilder()
        .withTraceId(uuidv4())
        .withOrganizationId("org123");

      const result = builder.build();

      expect(result.success).toBe(false);
      expect(result.request).toBeUndefined();
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("CERT-002: Builder always creates valid requests", () => {
      const traceId = uuidv4();
      const recipient = RecipientFactory.create({
        id: "user123",
        email: "test@example.com",
        role: "applicant",
        organizationId: "org123",
      });

      const plan = ChannelPlanFactory.create({
        recipientId: "user123",
        primary: "email",
      });

      const template = {
        id: "tmpl123",
        name: "welcome",
        version: "1.0.0",
        language: "en",
        channel: "email" as const,
        variables: ["name"],
        status: "PUBLISHED" as const,
      };

      const rendered = RenderedTemplateFactory.create({
        templateId: "tmpl123",
        subject: "Welcome!",
        body: "Hello user",
        channel: "email",
      });

      const builder = new CommunicationRequestBuilder()
        .withTraceId(traceId)
        .withOrganizationId("org123")
        .withEvent("user.registration")
        .withEventPayload({ userId: "user123" })
        .withAudiences(["applicant"])
        .withRecipients([recipient])
        .withChannels(["email"])
        .withChannelPlan([plan])
        .withTemplate(template)
        .withRendered(rendered);

      const result = builder.build();

      expect(result.success).toBe(true);
      expect(result.request).toBeDefined();

      // Validate the result
      const validation = CommunicationRequestValidator.validate(result.request);
      expect(validation.valid).toBe(true);
    });

    it("CERT-003: Requests are immutable", () => {
      const traceId = uuidv4();
      const recipient = RecipientFactory.create({
        id: "user123",
        email: "test@example.com",
        role: "applicant",
        organizationId: "org123",
      });

      const plan = ChannelPlanFactory.create({
        recipientId: "user123",
        primary: "email",
      });

      const template = {
        id: "tmpl123",
        name: "welcome",
        version: "1.0.0",
        language: "en",
        channel: "email" as const,
        variables: ["name"],
        status: "PUBLISHED" as const,
      };

      const rendered = RenderedTemplateFactory.create({
        templateId: "tmpl123",
        subject: "Welcome!",
        body: "Hello user",
        channel: "email",
      });

      const builder = new CommunicationRequestBuilder()
        .withTraceId(traceId)
        .withOrganizationId("org123")
        .withEvent("user.registration")
        .withEventPayload({ userId: "user123" })
        .withAudiences(["applicant"])
        .withRecipients([recipient])
        .withChannels(["email"])
        .withChannelPlan([plan])
        .withTemplate(template)
        .withRendered(rendered);

      const result = builder.build();
      const request = result.request!;

      // Should not be able to modify any property
      expect(() => {
        (request as any).traceId = "modified";
      }).toThrow();

      expect(() => {
        (request as any).event = "modified";
      }).toThrow();

      expect(() => {
        (request.audiences as any).push("new_role");
      }).toThrow();
    });

    it("CERT-004: Validator rejects invalid requests", () => {
      const validation = CommunicationRequestValidator.validate({
        // Missing required fields
        organizationId: "org123",
      });

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it("CERT-005: Factory creates immutable objects", () => {
      const traceId = uuidv4();
      const recipient = RecipientFactory.create({
        id: "user123",
        email: "test@example.com",
        role: "applicant",
        organizationId: "org123",
      });

      const plan = ChannelPlanFactory.create({
        recipientId: "user123",
        primary: "email",
      });

      const template = {
        id: "tmpl123",
        name: "welcome",
        version: "1.0.0",
        language: "en",
        channel: "email" as const,
        variables: ["name"],
        status: "PUBLISHED" as const,
      };

      const rendered = RenderedTemplateFactory.create({
        templateId: "tmpl123",
        subject: "Welcome!",
        body: "Hello user",
        channel: "email",
      });

      const request = CommunicationRequestFactory.createFromBuilder((builder) => {
        builder
          .withTraceId(traceId)
          .withOrganizationId("org123")
          .withEvent("user.registration")
          .withEventPayload({ userId: "user123" })
          .withAudiences(["applicant"])
          .withRecipients([recipient])
          .withChannels(["email"])
          .withChannelPlan([plan])
          .withTemplate(template)
          .withRendered(rendered);
      });

      // Attempt mutations should fail
      expect(Object.isFrozen(request)).toBe(true);
      expect(Object.isFrozen(request.eventPayload)).toBe(true);
      expect(Object.isFrozen(request.recipients)).toBe(true);
      expect(Object.isFrozen(request.channels)).toBe(true);
    });
  });
});
