import { Body, Container, Head, Heading, Html, Preview, Text } from "react-email";

export type Inquiry = {
  name: string;
  email: string;
  company?: string;
  budget?: string;
  message: string;
};

export function AdInquiryEmail({ inquiry }: { inquiry: Inquiry }) {
  return (
    <Html>
      <Head />
      <Preview>New advertiser inquiry from {inquiry.name}</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", background: "#f7f5f0" }}>
        <Container style={{ background: "#ffffff", padding: 24, borderRadius: 12 }}>
          <Heading style={{ fontSize: 20 }}>New advertiser inquiry</Heading>
          <Text>
            <b>Name:</b> {inquiry.name}
            <br />
            <b>Email:</b> {inquiry.email}
            <br />
            <b>Company:</b> {inquiry.company || "—"}
            <br />
            <b>Budget:</b> {inquiry.budget || "—"}
          </Text>
          <Text style={{ whiteSpace: "pre-wrap" }}>{inquiry.message}</Text>
        </Container>
      </Body>
    </Html>
  );
}
