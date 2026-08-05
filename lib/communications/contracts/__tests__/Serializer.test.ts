/**
 * SERIALIZER TESTS
 * ===============
 * Tests proving serialization preserves all fields and structure.
 * K1.C0 — Communication Contract Certification
 */

import {
  CommunicationRequestBuilder,
  CommunicationRequestValidator,
  CommunicationRequestSerializer,
  RecipientFactory,
  ChannelPlanFactory,
  RenderedTemplateFactory,
} from "../index";
import { v4 as uuidv4 } from "uuid";

describe("CommunicationRequestSerializer", () => {
  const createValidRequest = () => {
    const traceId = uuidv4();
    const recipient = RecipientFactory.create({
      id: "user123",
      email: "test@example.com",
      role: "applicant",
      organizationId: "org123",
      name: "Test User",
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
      variables: ["name", "programName"],
      status: "PUBLISHED" as const,
    };

    const rendered = RenderedTemplateFactory.create({
      templateId: "tmpl123",
      subject: "Welcome to Heloci!",
      body: "Hello {{name}}, welcome to {{programName}}",
      html: "<h1>Welcome</h1><p>Hello {{name}}</p>",
      channel: "email",
      variables: {
        substituted: { name: "Test User", programName: "Housing First" },
        missing: [],
      },
    });

    const builder = new CommunicationRequestBuilder()
      .withTraceId(traceId)
      .withOrganizationId("org123")
      .withUserId("admin456")
      .withEvent("user.registration")
      .withEventPayload({
        userId: "user123",
        email: "test@example.com",
        timestamp: new Date().toISOString(),
      })
      .withAudiences(["applicant"])
      .withRecipients([recipient])
      .withChannels(["email", "internal"])
      .withChannelPlan([plan])
      .withTemplate(template)
      .withRendered(rendered)
      .withTags(["important", "user-action"])
      .withCorrelationId("corr-456");

    const result = builder.build();
    if (!result.success || !result.request) {
      throw new Error("Failed to create valid request");
    }
    return result.request;
  };

  describe("Serialization", () => {
    it("should serialize valid request", () => {
      const request = createValidRequest();
      const serialized = CommunicationRequestSerializer.serialize(request);

      expect(serialized).toBeDefined();
      expect(serialized.traceId).toBe(request.traceId);
      expect(serialized.organizationId).toBe("org123");
      expect(serialized.event).toBe("user.registration");
      expect(serialized.version).toBe("1.0.0");
    });

    it("should preserve all recipients", () => {
      const request = createValidRequest();
      const serialized = CommunicationRequestSerializer.serialize(request);

      expect(serialized.recipients).toHaveLength(1);
      expect(serialized.recipients[0].email).toBe("test@example.com");
      expect(serialized.recipients[0].name).toBe("Test User");
    });

    it("should preserve channel plan", () => {
      const request = createValidRequest();
      const serialized = CommunicationRequestSerializer.serialize(request);

      expect(serialized.channelPlan).toHaveLength(1);
      expect(serialized.channelPlan[0].primary).toBe("email");
      expect(serialized.channelPlan[0].fallbacks).toContain("internal");
    });

    it("should preserve rendered template", () => {
      const request = createValidRequest();
      const serialized = CommunicationRequestSerializer.serialize(request);

      expect(serialized.rendered).toBeDefined();
      expect(serialized.rendered.subject).toBe("Welcome to Heloci!");
      expect(serialized.rendered.variables.substituted).toEqual({
        name: "Test User",
        programName: "Housing First",
      });
    });

    it("should convert Date to ISO string", () => {
      const request = createValidRequest();
      const serialized = CommunicationRequestSerializer.serialize(request);

      expect(typeof serialized.createdAt).toBe("string");
      expect(() => new Date(serialized.createdAt)).not.toThrow();
    });

    it("should include version", () => {
      const request = createValidRequest();
      const serialized = CommunicationRequestSerializer.serialize(request);

      expect(serialized.version).toBe("1.0.0");
    });
  });

  describe("Deserialization", () => {
    it("should deserialize back to valid request", () => {
      const original = createValidRequest();
      const serialized = CommunicationRequestSerializer.serialize(original);
      const deserialized = CommunicationRequestSerializer.deserialize(serialized);

      expect(deserialized).toBeDefined();
      expect(deserialized.traceId).toBe(original.traceId);
      expect(deserialized.organizationId).toBe(original.organizationId);
      expect(deserialized.event).toBe(original.event);
    });

    it("should restore immutability after deserialization", () => {
      const original = createValidRequest();
      const serialized = CommunicationRequestSerializer.serialize(original);
      const deserialized = CommunicationRequestSerializer.deserialize(serialized);

      expect(Object.isFrozen(deserialized)).toBe(true);
      expect(Object.isFrozen(deserialized.recipients)).toBe(true);

      // Should throw on mutation attempt
      expect(() => {
        (deserialized as any).traceId = "modified";
      }).toThrow();
    });

    it("should validate deserialized request", () => {
      const original = createValidRequest();
      const serialized = CommunicationRequestSerializer.serialize(original);
      const deserialized = CommunicationRequestSerializer.deserialize(serialized);

      const validation = CommunicationRequestValidator.validate(deserialized);
      expect(validation.valid).toBe(true);
    });

    it("should reject incompatible version", () => {
      const original = createValidRequest();
      const serialized = CommunicationRequestSerializer.serialize(original);
      serialized.version = "2.0.0";

      expect(() => {
        CommunicationRequestSerializer.deserialize(serialized);
      }).toThrow();
    });
  });

  describe("JSON serialization", () => {
    it("should convert to JSON string", () => {
      const request = createValidRequest();
      const json = CommunicationRequestSerializer.toJSON(request);

      expect(typeof json).toBe("string");
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it("should restore from JSON string", () => {
      const original = createValidRequest();
      const json = CommunicationRequestSerializer.toJSON(original);
      const restored = CommunicationRequestSerializer.fromJSON(json);

      expect(restored.traceId).toBe(original.traceId);
      expect(restored.event).toBe(original.event);
      expect(restored.recipients).toHaveLength(1);
    });

    it("should be reversible", () => {
      const original = createValidRequest();
      const json = CommunicationRequestSerializer.toJSON(original);
      const restored = CommunicationRequestSerializer.fromJSON(json);
      const json2 = CommunicationRequestSerializer.toJSON(restored);

      expect(json).toBe(json2);
    });
  });

  describe("Logging extraction", () => {
    it("should extract minimal logging data", () => {
      const request = createValidRequest();
      const logging = CommunicationRequestSerializer.extractForLogging(request);

      expect(logging.traceId).toBe(request.traceId);
      expect(logging.event).toBe("user.registration");
      expect(logging.organizationId).toBe("org123");
      expect(logging.recipientCount).toBe(1);
      expect(logging.channels).toContain("email");
      expect(logging.channels).toContain("internal");
    });

    it("should use ISO date format for logging", () => {
      const request = createValidRequest();
      const logging = CommunicationRequestSerializer.extractForLogging(request);

      expect(typeof logging.createdAt).toBe("string");
      expect(() => new Date(logging.createdAt)).not.toThrow();
    });
  });

  describe("Diff tracking", () => {
    it("should detect no changes in identical requests", () => {
      const original = createValidRequest();
      const serialized1 = CommunicationRequestSerializer.serialize(original);
      const serialized2 = CommunicationRequestSerializer.serialize(original);

      const diff = CommunicationRequestSerializer.diff(serialized1, serialized2);

      expect(diff.hasChanges).toBe(false);
      expect(Object.keys(diff.changes)).toHaveLength(0);
    });

    it("should detect changes to enrichable fields", () => {
      const original = createValidRequest();
      const serialized1 = CommunicationRequestSerializer.serialize(original);

      // Create modified version
      const modified = { ...serialized1 };
      modified.tags = ["modified", "tag"];

      const diff = CommunicationRequestSerializer.diff(serialized1, modified);

      expect(diff.hasChanges).toBe(true);
      expect(diff.changes.tags).toBeDefined();
    });

    it("should flag immutable field changes as violations", () => {
      const original = createValidRequest();
      const serialized1 = CommunicationRequestSerializer.serialize(original);

      // Try to change immutable field
      const modified = { ...serialized1 };
      (modified as any).event = "modified.event";

      const diff = CommunicationRequestSerializer.diff(serialized1, modified);

      expect(diff.hasChanges).toBe(true);
      expect(diff.changes.event).toBeDefined();
    });
  });

  describe("Contract Certification", () => {
    it("CERT-001: Serializer preserves all fields", () => {
      const original = createValidRequest();
      const serialized = CommunicationRequestSerializer.serialize(original);
      const deserialized = CommunicationRequestSerializer.deserialize(serialized);

      expect(deserialized.traceId).toBe(original.traceId);
      expect(deserialized.organizationId).toBe(original.organizationId);
      expect(deserialized.userId).toBe(original.userId);
      expect(deserialized.event).toBe(original.event);
      expect(deserialized.recipients.length).toBe(original.recipients.length);
      expect(deserialized.channels.length).toBe(original.channels.length);
      expect(deserialized.template.id).toBe(original.template.id);
      expect(deserialized.rendered.subject).toBe(original.rendered.subject);
    });

    it("CERT-002: JSON serialization is reversible", () => {
      const original = createValidRequest();
      const json = CommunicationRequestSerializer.toJSON(original);
      const restored = CommunicationRequestSerializer.fromJSON(json);
      const json2 = CommunicationRequestSerializer.toJSON(restored);

      expect(json).toBe(json2);

      // Validate both are equivalent
      const validation1 = CommunicationRequestValidator.validate(restored);
      expect(validation1.valid).toBe(true);
    });

    it("CERT-003: Deserialized requests are immutable", () => {
      const original = createValidRequest();
      const serialized = CommunicationRequestSerializer.serialize(original);
      const deserialized = CommunicationRequestSerializer.deserialize(serialized);

      expect(Object.isFrozen(deserialized)).toBe(true);
      expect(() => {
        (deserialized as any).traceId = "modified";
      }).toThrow();
    });
  });
});
