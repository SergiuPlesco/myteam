import { Availability } from "@prisma/client";
import { useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import AvailabilityFilter from "@/components/Filters/AvailabilityFilter/AvailabilityFilter";
import Pagination from "@/components/Pagination/Pagination";
import { Input } from "@/components/ui/input";
import UserCard from "@/components/UserCard/UserCard";
import UserSkeleton from "@/components/UserSkeleton/UserSkeleton";
import { trpc } from "@/utils/trpc";

const EmployeesPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [availability, setAvailability] = useState<Availability[]>([]);

  const { data, isLoading, isFetching } = trpc.users.filter.useQuery({
    searchQuery,
    page: currentPage,
    perPage: 12,
    availability,
  });

  const debounced = useDebouncedCallback(
    (value) => {
      setSearchQuery(value);
      setCurrentPage(1);
    },

    1000
  );

  const handleSetSearchQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    debounced(e.target.value);
  };

  return (
    <div className="flex flex-col gap-10">
      <div>
        <Input
          type="search"
          placeholder="Search by name, skill, project, position..."
          defaultValue={searchQuery}
          onChange={handleSetSearchQuery}
          className="text-base"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[minmax(0,200px),1fr] gap-10">
        <AvailabilityFilter
          availability={availability}
          setAvailability={setAvailability}
        />
        <div className="flex flex-col justify-center items-center gap-5">
          {isLoading || isFetching ? (
            <UserSkeleton />
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
                {data &&
                  data.users.length > 0 &&
                  data.users.map((user) => {
                    return <UserCard key={user.id} user={user} />;
                  })}
              </div>
              <Pagination
                page={currentPage}
                count={data?.pagination.totalPages || 0}
                onChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeesPage;
