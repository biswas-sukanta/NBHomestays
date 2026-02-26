import HomestayForm from '@/components/host/HomestayForm';

export default function EditHomestayPage({ params }: { params: { id: string } }) {
    return <HomestayForm id={params.id} isEditMode={true} />;
}
