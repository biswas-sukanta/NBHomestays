import HomestayForm from '@/components/host/HomestayForm';

export default async function EditHomestayPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return <HomestayForm id={id} isEditMode={true} />;
}
