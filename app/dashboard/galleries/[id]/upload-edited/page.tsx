import { redirect } from 'next/navigation'

type UploadEditedPageProps = {
  params: Promise<{ id: string }>
}

export default async function UploadEditedPage({ params }: UploadEditedPageProps) {
  const { id } = await params
  redirect(`/dashboard/galleries/${id}/selections`)
}
