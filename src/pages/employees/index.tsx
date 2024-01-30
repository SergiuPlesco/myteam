import { SlidersIcon } from "lucide-react";

import FiltersAccordion from "@/components/Filters/FiltersAccordion/FiltersAccordion";
import FiltersList from "@/components/Filters/FiltersList/FiltersList";
import FiltersReset from "@/components/Filters/FiltersReset/FiltersReset";
import SearchFilter from "@/components/Filters/SearchFilter/SearchFilter";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { ScrollArea } from "@/components/ui/scroll-area";
import UsersList from "@/components/UsersList/UsersList";

const EmployeesPage = () => {
  return (
    <div className="flex flex-col gap-10">
      <div>
        <SearchFilter />
      </div>
      <div>
        <FiltersList />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,200px),1fr] gap-10">
        <div className="flex justify-end md:hidden">
          <Drawer>
            <DrawerTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 w-50 opacity-50"
              >
                <SlidersIcon />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Select filters to refine your search.</DrawerTitle>
                <DrawerDescription>
                  Filters are applied instantly as you select them.
                </DrawerDescription>
              </DrawerHeader>
              <ScrollArea
                className="px-6 py-4 border rounded m-1 h-[400px]"
                type="always"
              >
                <FiltersAccordion />
              </ScrollArea>
              <DrawerFooter>
                <FiltersReset />
                <DrawerClose asChild>
                  <Button className="bg-[--smart-purple]">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
        <div className="hidden md:block">
          <FiltersReset />
          <FiltersAccordion />
        </div>
        <div>
          <UsersList />
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage;
