import React, { useState } from "react";
import ReactStars from "react-stars";
import { Description, Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import {
  reviewCreateHandler,
  reviewDeleteHandler,
  reviewEditHandler,
} from "@/app/api/reviews";
import { useAppSelector } from "@/app/hooks";
import WarningDialogs from "./Product/WarningDialogs";

interface Review {
  reviewid: number;
  userid: number;
  rating: number;
  title: string;
  comment: string;
  username: string;
  createdat: string;
}

const ProductDialogs = ({
  dialogType,
  setdialogType,
  setloading,
  productID,
  selectedReview,
  selectedRating,
  setselectedRating,
}: {
  dialogType: string | null;
  setdialogType: React.Dispatch<React.SetStateAction<string | null>>;
  setloading: React.Dispatch<React.SetStateAction<boolean>>;
  productID: number;
  selectedReview: Review | null;
  selectedRating: number;
  setselectedRating: React.Dispatch<React.SetStateAction<number>>;
}) => {
  const [stars, setstars] = useState(5);
  const defaultAccount = useAppSelector((state) => state.userState.defaultAccount);
  const [starWarning, setstarWarning] = useState(false);
  const [WarningType, setWarningType] = useState<string | null>(null);

  async function createForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!defaultAccount?.userID) {
      setWarningType("login");
      return;
    }

    if (stars < 1) {
      setstarWarning(true);
      return;
    }

    setloading(true);

    const formData = new FormData(e.currentTarget);
    const title = String(formData.get("title") || "").trim();
    const comment = String(formData.get("description") || "").trim();

    if (title.length < 2 || comment.length < 2) {
      setloading(false);
      setWarningType("error");
      return;
    }

    const response = await reviewCreateHandler({
      userID: Number(defaultAccount.userID),
      productID: Number(productID),
      rating: Number(stars),
      title,
      comment,
    });

    setdialogType(null);
    setloading(false);

    switch (response.status) {
      case 200:
        setWarningType("successful");
        window.location.reload();
        break;
      case 205:
        setWarningType("exists");
        break;
      case 210:
        setWarningType("noOrder");
        break;
      case 401:
        setWarningType("login");
        break;
      default:
        console.error("Create review error:", response);
        setWarningType("error");
        break;
    }
  }

  async function editForm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedReview || !defaultAccount?.userID) {
      setWarningType("error");
      return;
    }

    if (selectedRating < 1) {
      setstarWarning(true);
      return;
    }

    setloading(true);

    const formData = new FormData(e.currentTarget);
    const title = String(formData.get("title") || "").trim();
    const comment = String(formData.get("description") || "").trim();

    const response = await reviewEditHandler({
      reviewID: Number(selectedReview.reviewid),
      userID: Number(defaultAccount.userID),
      productID: Number(productID),
      rating: Number(selectedRating),
      title,
      comment,
    });

    setdialogType(null);
    setloading(false);

    switch (response.status) {
      case 200:
        setWarningType("successful");
        window.location.reload();
        break;
      case 205:
        setWarningType("notExists");
        break;
      default:
        console.error("Edit review error:", response);
        setWarningType("error");
        break;
    }
  }

  async function deleteForm() {
    if (!selectedReview || !defaultAccount?.userID) {
      setWarningType("error");
      return;
    }

    setloading(true);

    const response = await reviewDeleteHandler({
      reviewID: Number(selectedReview.reviewid),
      userID: Number(defaultAccount.userID),
      productID: Number(productID),
    });

    setdialogType(null);
    setloading(false);

    switch (response.status) {
      case 200:
        setWarningType("deleted");
        window.location.reload();
        break;
      case 205:
        setWarningType("notExists");
        break;
      default:
        console.error("Delete review error:", response);
        setWarningType("error");
        break;
    }
  }

  return (
    <>
      <WarningDialogs
        WarningType={WarningType}
        setWarningType={setWarningType}
        setloading={setloading}
      />

      <div>
        <Dialog
          open={dialogType === "create"}
          onClose={() => setdialogType(null)}
          className="relative z-50"
        >
          <div className="fixed inset-0 flex w-screen items-center justify-center p-4 drop-shadow-custom-xl">
            <DialogPanel className="max-w-lg space-y-4 border bg-white p-8 rounded-xl text-center">
              <DialogTitle className="font-bold">Write a Review</DialogTitle>
              <Description>Share your Review</Description>

              <form onSubmit={createForm} className="flex flex-col gap-2">
                <div className="flex flex-col items-center">
                  <label>Stars</label>
                  {starWarning && (
                    <p className="text-red-500">Rate Atleast 1 Star to Proceed</p>
                  )}
                  <ReactStars
                    count={5}
                    onChange={(newRating) => setstars(newRating)}
                    value={stars}
                    size={50}
                    edit={true}
                    color2="#ffd700"
                  />

                  <label>Title</label>
                  <input
                    placeholder="Review Title in 50 characters"
                    required
                    id="title"
                    name="title"
                    type="text"
                    minLength={2}
                    maxLength={50}
                    className="border-[1px] w-[300px] rounded-md py-1 mx-auto"
                  />

                  <label>Description</label>
                  <textarea
                    placeholder="Review Description in 500 characters"
                    required
                    id="description"
                    name="description"
                    minLength={2}
                    maxLength={500}
                    rows={4}
                    cols={40}
                    className="border-[1px] rounded-md py-1 mx-auto"
                  />
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    type="button"
                    className="border-[1.5px] hover:bg-black transition-colors duration-300 hover:text-white py-2 px-6 rounded-xl"
                    onClick={() => setdialogType(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary-600 text-white py-2 hover:bg-primary-800 transition-colors duration-300 px-8 rounded-xl"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </DialogPanel>
          </div>
        </Dialog>

        <Dialog
          open={dialogType === "edit"}
          onClose={() => setdialogType(null)}
          className="relative z-50"
        >
          <div className="fixed inset-0 flex w-screen items-center justify-center p-4 drop-shadow-custom-xl">
            <DialogPanel className="max-w-lg space-y-4 border bg-white p-8 rounded-xl text-center">
              <DialogTitle className="font-bold">Edit Review</DialogTitle>
              <Description>Share your Review</Description>

              <form onSubmit={editForm} className="flex flex-col gap-2">
                <div className="flex flex-col items-center">
                  <label>Stars</label>
                  {starWarning && (
                    <p className="text-red-500">Rate Atleast 1 Star to Proceed</p>
                  )}
                  <ReactStars
                    count={5}
                    onChange={(newRating) => setselectedRating(newRating)}
                    value={selectedRating}
                    size={50}
                    edit={true}
                    color2="#ffd700"
                  />

                  <label>Title</label>
                  <input
                    defaultValue={selectedReview != null ? selectedReview.title : ""}
                    placeholder="Review Title in 50 characters"
                    required
                    id="title"
                    name="title"
                    type="text"
                    minLength={2}
                    maxLength={50}
                    className="border-[1px] w-[300px] rounded-md py-1 mx-auto"
                  />

                  <label>Description</label>
                  <textarea
                    defaultValue={selectedReview != null ? selectedReview.comment : ""}
                    placeholder="Review Description in 500 characters"
                    required
                    id="description"
                    name="description"
                    minLength={2}
                    maxLength={500}
                    rows={4}
                    cols={40}
                    className="border-[1px] rounded-md py-1 mx-auto"
                  />
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    type="button"
                    className="border-[1.5px] hover:bg-black transition-colors duration-300 hover:text-white py-2 px-6 rounded-xl"
                    onClick={() => setdialogType(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-primary-600 text-white py-2 hover:bg-primary-800 transition-colors duration-300 px-8 rounded-xl"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </DialogPanel>
          </div>
        </Dialog>

        <Dialog
          open={dialogType === "delete"}
          onClose={() => setdialogType(null)}
          className="relative z-50"
        >
          <div className="fixed inset-0 flex w-screen items-center justify-center p-4">
            <DialogPanel className="max-w-lg space-y-4 border p-6 rounded-xl text-center drop-shadow-custom-xl bg-red-400 text-white">
              <DialogTitle className="font-bold">Confirmation</DialogTitle>
              <Description>Are you sure, you want to delete the Review?</Description>
              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  className="border-[1.5px] text-black hover:bg-red-200 bg-white transition-colors duration-300 hover:text-black py-2 px-6 rounded-xl"
                  onClick={() => setdialogType(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="border-[1.5px] hover:bg-white transition-colors duration-300 hover:text-black py-2 px-6 rounded-xl"
                  onClick={deleteForm}
                >
                  Delete
                </button>
              </div>
            </DialogPanel>
          </div>
        </Dialog>
      </div>
    </>
  );
};

export default ProductDialogs;
