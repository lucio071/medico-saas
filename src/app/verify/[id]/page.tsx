type VerifyPageProps = {
  params: Promise<{ id: string }>;
};

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { id } = await params;

  return <h1>Verify {id}</h1>;
}
