import { useRouter } from "next/router";
import React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { TUser } from "@/typeDefinitions/typeDefinitions";
import { trpc } from "@/utils/trpc";

import { Button } from "../ui/button";
import { useToast } from "../ui/use-toast";

const DeleteUser = ({ user }: { user: TUser }) => {
  const { toast } = useToast();
  const router = useRouter();
  const utils = trpc.useContext();
  const deleteUser = trpc.users.deleteById.useMutation();

  const handleDeleteUser = () => {
    deleteUser.mutate(
      {
        userId: user.id,
      },
      {
        onSuccess: () => {
          toast({
            description: `${user.name} has been deleted.`,
            variant: "success",
          });
          utils.users.all.invalidate();
          router.push("/employees");
        },
        onError: () => {
          toast({
            description: "Something went wrong.",
            variant: "destructive",
          });
        },
      }
    );
  };
  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant={"destructive"} className="w-full">
            Delete {`${user.name}`}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              account and its data from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default DeleteUser;