import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from "@react-email/components";

export function ResetPasswordEmail({ name, url }: { name: string; url: string }) {
  return (
    <Html>
      <Head />
      <Preview>Reset your race-key password</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", background: "#f7f5f0" }}>
        <Container style={{ background: "#ffffff", padding: 24, borderRadius: 12 }}>
          <Heading style={{ fontSize: 20 }}>Reset your password</Heading>
          <Text>Hi {name}, someone asked to reset the password for your race-key account.</Text>
          <Button
            href={url}
            style={{
              background: "#2f5d50",
              color: "#ffffff",
              padding: "10px 18px",
              borderRadius: 8,
            }}
          >
            Choose a new password
          </Button>
          <Text style={{ color: "#6b665c", fontSize: 13 }}>
            If this wasn&apos;t you, ignore this email. The link expires in one hour.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
