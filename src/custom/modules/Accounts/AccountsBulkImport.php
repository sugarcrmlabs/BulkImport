<?php

// Enrico Simonetti
// 2017-03-16

require_once('custom/include/bulkimport/BulkImport.php');

class AccountsBulkImport extends BulkImport
{
    public function callCustomBeforeSave($b, $data, $args)
    {
        if (!empty($data['team_list'])) {
            $teams = explode('|', $data['team_list']);
            if (!empty($teams) && is_array($teams)) {
                $b->team_id = $teams['0'];
            }
        }

        if(!empty($data['external_assigned_user_key'])) {
            $sugar_id = $this->getSugarRecordId(BeanFactory::getBean('Users'), $data['external_assigned_user_key']);
            unset($b->external_assigned_user_key);

            if(!empty($sugar_id)) {
                $b->assigned_user_id = $sugar_id;
            } else {
                $b->assigned_user_id = 1;
            }
        }
    }

    public function callCustomAfterSave($b, $data, $args)
    {
        if (!empty($data['team_list'])) {
            $teams = explode('|', $data['team_list']);
            if (!empty($teams) && is_array($teams)) {
                $b->load_relationship('teams');
                $b->teams->replace(
                    $teams
                );
            }
        }
    }
}
