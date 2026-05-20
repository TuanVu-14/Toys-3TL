import { redirect } from 'next/navigation'

export default function Page({ params }: { params: { category: string } }) {
  redirect(`/categories/${params.category}`)
}
