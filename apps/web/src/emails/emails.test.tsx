import { render } from "@react-email/render";
import { describe, expect, it } from "vitest";
import { AdInquiryEmail } from "./ad-inquiry";
import { ResetPasswordEmail } from "./reset-password";

describe("emails", () => {
  it("renders the password reset link", async () => {
    const html = await render(
      <ResetPasswordEmail name="Ada" url="https://race-key.test/reset?t=1" />,
    );
    expect(html).toContain("https://race-key.test/reset?t=1");
    const text = await render(<ResetPasswordEmail name="Ada" url="https://x.test" />, {
      plainText: true,
    });
    expect(text).toContain("Hi Ada");
  });

  it("renders every advertiser field", async () => {
    const text = await render(
      <AdInquiryEmail
        inquiry={{ name: "Ada", email: "ada@shop.test", company: "Keys", message: "A banner" }}
      />,
      { plainText: true },
    );
    for (const s of ["Ada", "ada@shop.test", "Keys", "A banner"]) expect(text).toContain(s);
  });
});
