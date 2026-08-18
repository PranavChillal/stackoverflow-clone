import React from "react";
import { useRouter } from "next/router";
import MainLayout from "@/layout/MainLayout";
import QuestionDetail from "@/components/ui/QuestionDetail";

const index = () => {
    const router = useRouter();
    const { id } = router.query;

    return (
        <MainLayout>
            <QuestionDetail
                questionId={Array.isArray(id) ? id[0] : id}
            />
        </MainLayout>
    );
};

export default index;