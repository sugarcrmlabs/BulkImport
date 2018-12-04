<?php

// Shad Mickelberry
// custom/modules/Documents/DocumentsBulkImport.php
// 2018-11-22

use Sugarcrm\Sugarcrm\Util\Uuid;
require_once('custom/include/bulkimport/BulkImport.php');

/**
 * Class DocumentsBulkImport
 */
class DocumentsBulkImport extends BulkImport
{

    public function callCustomBeforeSave($b, $data, $args)
    {

        if (!empty($data['team_list'])) {
            $teams = explode('|', $data['team_list']);
            if (!empty($teams) && is_array($teams)) {
                $b->team_id = $teams['0'];
            }
        }

        // If creating a new record we need to generate an ID for the revision
        if (!$b->id) {
            $b->new_with_id = true;
            $b->id = Uuid::uuid1();
        }


        // Assign using external ID. To work the config settings for Users
        // must also be set. Default to user->id = 1
        if(!empty($data['external_assigned_user_key'])) {

            $sugar_id = $this->getSugarRecordId(BeanFactory::getBean('Users'), $data['external_assigned_user_key']);
            unset($b->external_assigned_user_key);

            if(!empty($sugar_id)) {
                $b->assigned_user_id = $sugar_id;
            } else {
                $b->assigned_user_id = 1;
            }

        } else {

            $b->assigned_user_id = 1;

        }

        // Set created by user using external ID. To work the config settings for Users
        // must also be set. Default to user->id = 1
        if(!empty($data['external_created_user_key'])) {

            $sugar_id = $this->getSugarRecordId(BeanFactory::getBean('Users'), $data['external_created_user_key']);
            unset($b->external_created_user_key);

            if(!empty($sugar_id)) {
                $b->set_created_by = true;
                $b->created_by = $sugar_id;
            } else {
                $b->created_by = 1;
            }
        } else {
            $b->created_by = 1;
        }

        // Set modified by user using external ID. To work the config settings for Users
        // must also be set. Default to user->id = 1
        if(!empty($data['external_modified_user_key'])) {

            $sugar_id = $this->getSugarRecordId(BeanFactory::getBean('Users'), $data['external_modified_user_key']);
            unset($b->external_modified_user_key);

            if(!empty($sugar_id)) {
                $b->update_modified_by = true;
                $b->modified_user_id = $sugar_id;
            } else {
                $b->modified_user_id = 1;
            }
        } else {
            $b->modified_user_id = 1;
        }

        $b->status_id = 'Active';

        // Set revision.
        $revision = $this->setRevision($b, $data);

        $b->document_revision_id = $revision->id;
        $b->revision = $revision->revision;

    }

    /**
     * Save revision related to document
     * @param $b
     * @param $data
     *
     * @return null|SugarBean
     */
    public function setRevision($b, $data)
    {

        // Load revision by document ID If it exists
        $revision = BeanFactory::getBean('DocumentRevisions', $b->id);

        // If no ID save with same ID as document for convenience
        if (!$revision->id) {

            $revision->new_with_id = true;

            $revision->id = $b->id;
        }


        // Set revision
        // @todo allow for multiple revisions
        $revision->revision = 1;

        $revision->document_id = $b->id;
        $revision->change_log = 'Document Imported via Bulk Import';
        $revision->created_by = $b->created_by;
        $revision->filename = $b->document_name;

        // Allow for manual set of mime type
        if (!empty($data['file_mime_type'])) {

            $revision->file_mime_type = $data['file_mime_type'];

        } else {

            $revision->file_mime_type = get_mime_content_type_from_filename($revision->filename);

        }

        // Set file extension from document name
        $ext_pos = strrpos($revision->filename, ".");
        $revision->file_ext = substr($revision->filename, $ext_pos + 1);

        // Allow for external documents. To work the doc_url must be passed
        // in request as well as the doc_type must be set and not = Sugar
        if (isset($data['doc_url'])) {

            $revision->doc_url = $data['doc_url'];

        }

        $revision->doc_type = !empty($b->doc_type) ? $b->doc_type : 'Sugar';

        $revision->save('false');

        return $revision;

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
