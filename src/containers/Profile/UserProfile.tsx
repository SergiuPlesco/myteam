import { useRouter } from "next/router";

import Identity from "@/components/Identity/Identity";
import Managers from "@/components/Managers/Managers";
import Members from "@/components/Members/Members";
import Positions from "@/components/Positions/Positions";
import Spinner from "@/components/Spinner/Spinner";
import UserManager from "@/components/UserManager/UserManager";
import { USER_ROLES } from "@/constants/common";
import Projects from "@/containers/Projects/Projects";
import Skills from "@/containers/Skills/Skills";
import { cn } from "@/lib/utils";
import { trpc } from "@/utils/trpc";

const UserProfile = () => {
  const router = useRouter();
  const userId = router.query.id as string;

  const { data: loggedUser } = trpc.users.getLoggedUser.useQuery();
  const { data: user, isLoading } = trpc.users.getById.useQuery(
    {
      userId,
    },
    {
      enabled: Boolean(userId),
      cacheTime: 0,
    }
  );

  if (isLoading || !user) {
    return <Spinner />;
  }
  const isManager = user.members.length > 0;
  return (
    <div className="flex flex-col">
      <section className="flex justify-between">
        <Identity user={user} isLoggedUser={false} />
      </section>
      <section
        className={cn(
          "grid grid-cols-1 gap-4 mb-10",
          isManager && loggedUser?.role === USER_ROLES.ADMIN
            ? "md:grid-cols-4"
            : "md:grid-cols-3"
        )}
      >
        <Positions user={user} isLoggedUser={false} />
        <Managers user={user} isLoggedUser={false} />
        {isManager && <Members user={user} isLoggedUser={false} />}
        {loggedUser?.role === USER_ROLES.ADMIN && <UserManager user={user} />}
      </section>
      <section className="mb-10">
        <Skills user={user} isLoggedUser={false} />
      </section>
      <section className="mb-4">
        <Projects user={user} isLoggedUser={false} />
      </section>
    </div>
  );
};

export default UserProfile;
