
import React from 'react';
import { useBreakpoint } from '../hooks/use-mobile';
import Header from '../components/Header';
import { useCreatePoll } from '../hooks/use-create-poll';
import PollFormDesktop from '../components/poll/PollFormDesktop';
import PollFormMobile from '../components/poll/PollFormMobile';

const CreatePoll: React.FC = () => {
  const {
    question,
    setQuestion,
    options,
    imageUrl,
    setImageUrl,
    isSubmitting,
    uploadingPollImage,
    uploadingOptionImage,
    handleAddOption,
    handleRemoveOption,
    handleOptionChange,
    handleOptionImageChange,
    handleUploadPollImage,
    handleUploadOptionImage,
    handleSubmit
  } = useCreatePoll();
  
  const breakpoint = useBreakpoint();
  const isDesktop = breakpoint === "desktop";

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className={`pt-20 px-4 ${isDesktop ? 'max-w-4xl' : 'max-w-lg'} mx-auto pb-20`}>
        <div className="mb-6 animate-fade-in">
          <h2 className="text-2xl font-bold">Create Poll</h2>
          <p className="text-muted-foreground">Ask a question and collect opinions</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-border/50 p-5 animate-scale-in">
          {isDesktop ? (
            <PollFormDesktop
              question={question}
              setQuestion={setQuestion}
              options={options}
              imageUrl={imageUrl}
              isSubmitting={isSubmitting}
              uploadingPollImage={uploadingPollImage}
              uploadingOptionImage={uploadingOptionImage}
              handleAddOption={handleAddOption}
              handleRemoveOption={handleRemoveOption}
              handleOptionChange={handleOptionChange}
              handleOptionImageChange={handleOptionImageChange}
              handleUploadPollImage={handleUploadPollImage}
              handleUploadOptionImage={handleUploadOptionImage}
              handleSubmit={handleSubmit}
            />
          ) : (
            <PollFormMobile
              question={question}
              setQuestion={setQuestion}
              options={options}
              imageUrl={imageUrl}
              isSubmitting={isSubmitting}
              uploadingPollImage={uploadingPollImage}
              uploadingOptionImage={uploadingOptionImage}
              handleAddOption={handleAddOption}
              handleRemoveOption={handleRemoveOption}
              handleOptionChange={handleOptionChange}
              handleOptionImageChange={handleOptionImageChange}
              handleUploadPollImage={handleUploadPollImage}
              handleUploadOptionImage={handleUploadOptionImage}
              handleSubmit={handleSubmit}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default CreatePoll;
