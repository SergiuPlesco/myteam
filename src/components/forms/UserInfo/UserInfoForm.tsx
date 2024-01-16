import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "@prisma/client";
import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import React from "react";
import DatePicker from "react-datepicker";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

const FormSchema = z.object({
  phone: z
    .string()
    .length(
      9,
      "Please ensure it is 9 digits long and follows the format 0xxxxxxxx."
    ),
  employmentDate: z.date().nullable(),
  availability: z.enum(["FULLTIME", "PARTTIME", "NOTAVAILABLE"]),
});

const UserInfoForm = ({ user }: { user: User }) => {
  const { toast } = useToast();
  const utils = trpc.useContext();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    values: {
      phone: user?.phone || "",
      employmentDate: user?.employmentDate,
      availability: user?.availability,
    },
    mode: "all",
  });

  const updateInfo = trpc.users.userInfo.useMutation();
  const handleSubmit = (values: z.infer<typeof FormSchema>) => {
    updateInfo.mutate(
      {
        ...values,
      },
      {
        onSuccess: () => {
          toast({
            description: "Personal information has been updated.",
            variant: "success",
          });
          utils.users.getLoggedUser.invalidate();
        },
        onError: () => {
          toast({
            description: "An error occured, try again",
            variant: "destructive",
          });
        },
      }
    );
  };
  return (
    <div className="flex flex-col gap-4 border rounded p-2 mb-6 shadow-md">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col gap-2 w-full"
        >
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => {
              return (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="012345678"
                      type="number"
                      {...field}
                      pattern="[0-9]{9}"
                      className="text-base [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="w-full [&_.react-datepicker-wrapper]:w-full [&_span::before]:top-[13px]">
              <FormField
                control={form.control}
                name="employmentDate"
                render={({ field }) => {
                  return (
                    <FormItem className="flex flex-col gap-1 mt-2">
                      <FormLabel>Employment Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          selected={field.value}
                          onChange={field.onChange}
                          showMonthYearPicker
                          dateFormat="MMMM, yyyy"
                          popperPlacement="bottom"
                          className="w-full"
                          maxDate={new Date()}
                          customInput={
                            <Button
                              type="button"
                              variant={"outline"}
                              className={cn(
                                "justify-start text-left font-normal text-base",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                format(field.value, "MMMM, yyyy")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
            <div>
              <FormField
                control={form.control}
                name="availability"
                render={({ field }) => {
                  return (
                    <FormItem className="flex flex-col gap-1 mt-2">
                      <FormLabel className="flex justify-start items-center gap-1 relative">
                        Availability for new projects
                      </FormLabel>

                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl className="text-base">
                          <SelectTrigger>
                            <SelectValue placeholder="Select an option" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FULLTIME" className="text-base">
                            Full Time
                          </SelectItem>
                          <SelectItem value="PARTTIME" className="text-base">
                            Part Time
                          </SelectItem>
                          <SelectItem
                            value="NOTAVAILABLE"
                            className="text-base"
                          >
                            Not Available
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mb-4">
            <Button
              type="submit"
              className="mt-2 py-0 h-7 rounded bg-blue-300 bg-smartpurple"
              disabled={updateInfo.isLoading}
            >
              Save
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default UserInfoForm;
