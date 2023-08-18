import React, { useEffect, useState } from "react";

import Skill from "@/components/Skill/skill";
import { ISkill } from "@/types/ISkill";
import { trpc } from "@/utils/trpc";

const Skills = () => {
  const { data: fetchedskills } = trpc.skills.skillByUserId.useQuery();
  const { data: fetchedtopSkills } = trpc.skills.fetchTopSkills.useQuery();

  const [skills, setSkills] = useState<Array<ISkill>>([]);

  useEffect(() => {
    if (fetchedskills && fetchedtopSkills) {
      setSkills(fetchedskills);
    }
  }, [fetchedskills, fetchedtopSkills]);

  const handleSkillDelete = (skillId: number) => {
    setSkills((prev) => prev.filter((skill) => skill.id !== skillId));
  };
  return (
    <>
      <div className="w-full gap-5 flex flex-wrap">
        {skills.length === 0 ? (
          <div>no skill, add some</div>
        ) : (
          skills?.map((skill) => {
            return (
              <Skill
                key={skill.id}
                fetchedSkill={skill}
                onDelete={handleSkillDelete}
              />
            );
          })
        )}
      </div>
    </>
  );
};

export default Skills;
