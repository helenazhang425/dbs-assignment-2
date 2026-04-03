import CompanyDetail from "@/components/companies/CompanyDetail";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CompanyDetail companyId={id} />;
}
