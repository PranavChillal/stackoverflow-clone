import React from "react";
import { useRouter } from "next/router";
import MainLayout from "@/layout/MainLayout";
import QuestionDetail from "@/components/ui/QuestionDetail";

const index = () => {
  const router = useRouter();
  const { id } = router.query;

  const questionId = Array.isArray(id) ? id[0] : id;

  return (
    <MainLayout>
      <div className="w-full min-w-0">
        <QuestionDetail questionId={questionId} />
      </div>
    </MainLayout>
  );
};

export default index;
